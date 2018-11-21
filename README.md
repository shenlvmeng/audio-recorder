## audio-recorder

参考[recorderjs](https://github.com/mattdiamond/Recorderjs)的使用Web Audio API的录音工具。

### 引入

```
npm config set registry http://bnpm.byted.org
yarn add @byted/audio-recorder
```

```
import Recorder from '@byted/audio-recorder';
```

### 构造

默认通过`getUserMedia`拿到麦克风的音频流。

```
const recorder = Recorder.createFromUserMedia(config);
```

需要自定义的输入时，可以自己构造输入的音频流。

```
const recorder = new Recorder(source, config)
```

### config

支持的配置项包括：

- `bufferLen`，内置的JavaScript节点缓存数组长度，默认为4096
- `numChannels`，声道数，默认为2
- `mimeType`，导出的音频格式，默认为`audio/wav`
- `sampleRate`，音频采样率，建议是系统采样率的整数倍分之一，不可大于系统采样率，默认为系统采样率
- `sampletBit`，音频采样位数，8或者16，默认为16
- `callback`，`exportWAV`方法的回调

### 方法

```
recorder.record();

// ...

recorder.stop();
recorder.exportWAV([callback][, type]);
```

构造完成后，使用`record`方法开始录音，使用`stop`方法停止录音。使用`exportWAV`方法导出为录音文件，默认为audio/wav格式。之后可以执行`record`继续录音，或执行`clear`方法清除数据。


注意：`stop`方法只是**暂停**录音，继续record后，不是**覆盖**而是在已有录音后**继续**录音。需要清除录音重新开始时，使用`clear`方法。

```
recorder.clear()
```

在有些场景下，可能需要直接取出录音的ArrayBuffer做自定义处理，这时通过`getBuffer`方法实现。

```
recorder.getBuffer([callback])
```

### 工具方法

- `Recorder.forceDownload(blob, [, filename])`，强制浏览器下载文件
- `Recorder.createFromUserMedia([config])`，使用`getUserMedia`构造一个Recorder
