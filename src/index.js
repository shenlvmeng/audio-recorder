import InlineWorker from 'inline-worker';

export default class Recorder {
    static forceDownload(blob, filename) {
        const url = (window.URL || window.webkitURL).createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = filename || 'output.wav';
        link.click();
    }

    static async createFromUserMedia(config) {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    googEchoCancellation: 'false',
                    googAutoGainControl: 'false',
                    googNoiseSuppression: 'false',
                    googHighpassFilter: 'false'
                },
                optional: []
            },
            video: false
        });
        const context = new AudioContext();
        return new Recorder(context.createMediaStreamSource(stream, config));
    }

    constructor(source, cfg) {
        this.config = {
            bufferLen: 4096,
            numChannels: 2,
            mimeType: 'audio/wav',
            sampleBit: 16,
            ...cfg
        };

        this.recording = false;

        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };
        this.context = source.context;
        this.node = (this.context.createScriptProcessor
            || this.context.createJavaScriptNode).call(
            this.context,
            this.config.bufferLen,
            this.config.numChannels,
            this.config.numChannels
        );

        this.node.onaudioprocess = (e) => {
            if (!this.recording) return;

            const buffer = [];
            for (let channel = 0; channel < this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            this.worker.postMessage({
                command: 'record',
                buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);

        const self = {};
        this.worker = new InlineWorker(function () {
            let recLength = 0;
            let recBuffers = [];
            let sampleRate;
            let sampleRatio;
            let sampleBit;
            let numChannels;

            function initBuffers() {
                for (let channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function init(config) {
                ({ sampleRate, numChannels, sampleBit } = config);
                sampleRatio = config.originalSampleRate / sampleRate;
                if (sampleRate < 8000 || sampleRate > 48000) {
                    throw new Error('Invalid sample rate.');
                }
                if (numChannels < 1 || numChannels > 2) {
                    throw new Error('Invalid channel count.');
                }
                if (sampleBit !== 8 && sampleBit !== 16) {
                    throw new Error('Invalid sample bit.');
                }
                initBuffers();
            }

            function record(inputBuffer) {
                for (let channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }

            function mergeBuffers(buffers, length) {
                const result = new Float32Array(length);
                let offset = 0;
                for (let i = 0; i < buffers.length; i++) {
                    result.set(buffers[i], offset);
                    offset += buffers[i].length;
                }
                return result;
            }

            function interleave(inputL, inputR) {
                const length = inputL.length + inputR.length;
                const result = new Float32Array(length);

                let index = 0;
                let inputIndex = 0;

                while (index < length) {
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function compress(samples, ratio) {
                const length = samples.length / ratio;
                const result = new Float32Array(length);

                for (let index = 0; index < length; index++) {
                    result[index] = samples[index * ratio];
                }

                return result;
            }

            function writeString(view, offset, string) {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function floatTo16BitPCM(output, offset, input) {
                let initOffset = offset;
                for (let i = 0; i < input.length; i++, initOffset += 2) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(initOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function floatTo8bitPCM(output, offset, input) {
                let initOffset = offset;
                for (let i = 0; i < input.length; i++, initOffset++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    output.setInt8(initOffset, parseInt(val / 256 + 128, 10), true);
                }
            }

            function encodeWAV(samples) {
                const buffer = new ArrayBuffer(44 + samples.length * 2);
                const view = new DataView(buffer);

                /* RIFF identifier */
                writeString(view, 0, 'RIFF');
                /* RIFF chunk length */
                view.setUint32(4, 36 + samples.length * 2, true);
                /* RIFF type */
                writeString(view, 8, 'WAVE');
                /* format chunk identifier */
                writeString(view, 12, 'fmt ');
                /* format chunk length, PCM use 16 */
                view.setUint32(16, 16, true);
                /* sample format (raw), PCM use 1 */
                view.setUint16(20, 1, true);
                /* channel count */
                view.setUint16(22, numChannels, true);
                /* sample rate */
                view.setUint32(24, sampleRate, true);
                /* byte rate (sample rate * block align) */
                view.setUint32(28, sampleRate * numChannels * sampleBit / 8, true);
                /* block align (channel count * bytes per sample) */
                view.setUint16(32, numChannels * sampleBit / 8, true);
                /* bits per sample */
                view.setUint16(34, sampleBit, true);
                /* data chunk identifier */
                writeString(view, 36, 'data');
                /* data chunk length */
                view.setUint32(40, samples.length * 2, true);

                sampleBit === 8
                    ? floatTo8bitPCM(view, 44, samples)
                    : floatTo16BitPCM(view, 44, samples);

                return view;
            }

            function exportWAV(type) {
                const buffers = [];
                for (let channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                let interleaved;
                if (numChannels === 2) {
                    interleaved = interleave(buffers[0], buffers[1]);
                } else {
                    [interleaved] = buffers;
                }

                interleaved = compress(interleaved, Math.max(Math.round(sampleRatio), 1));
                const dataview = encodeWAV(interleaved);
                const audioBlob = new Blob([dataview], { type });

                this.postMessage({
                    command: 'exportWAV',
                    data: audioBlob
                });
            }

            function getBuffer() {
                const buffers = [];
                for (let channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                this.postMessage({
                    command: 'getBuffer',
                    data: buffers
                });
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            this.onmessage = function (e) {
                switch (e.data.command) {
                case 'init':
                    init(e.data.config);
                    break;
                case 'record':
                    record(e.data.buffer);
                    break;
                case 'exportWAV':
                    exportWAV(e.data.type);
                    break;
                case 'getBuffer':
                    getBuffer();
                    break;
                case 'clear':
                    clear();
                    break;
                default:
                }
            };
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.config.sampleRate || this.context.sampleRate,
                originalSampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels,
                sampleBit: this.config.sampleBit
            }
        });

        this.worker.onmessage = (e) => {
            const cb = this.callbacks[e.data.command].pop();
            if (typeof cb === 'function') {
                cb(e.data.data);
            }
        };
    }


    record() {
        this.recording = true;
    }

    stop() {
        this.recording = false;
    }

    clear() {
        this.worker.postMessage({ command: 'clear' });
    }

    getBuffer(cb) {
        const callback = cb || this.config.callback;
        if (!callback) throw new Error('Callback not set');

        this.callbacks.getBuffer.push(callback);

        this.worker.postMessage({ command: 'getBuffer' });
    }

    exportWAV(cb, type) {
        const mimeType = type || this.config.mimeType;
        const callback = cb || this.config.callback;
        if (!callback) throw new Error('Callback not set');

        this.callbacks.exportWAV.push(callback);

        this.worker.postMessage({
            command: 'exportWAV',
            type: mimeType
        });
    }
}
