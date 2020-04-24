onmessage = function (event) {

    var pixel = 0,
        pixelIndex = 0,
        pixina = event.data.bufferA.data,
        pixinb = event.data.bufferB.data,
        quality = event.data.quality,
        minValue = 99999999,
        maxValue = 0,
        i = 0,
        dataout = new ArrayBuffer(pixina.length),
        bufferView = new Int16Array(dataout),
        dicomObject = null;


    // merge buffers
    for (i = 0; i < pixina.length; i += 4) {
        pixel = 256 * pixina[i] + pixinb[i];
        bufferView[pixelIndex] = pixel;
        maxValue = Math.max(maxValue, pixel);
        minValue = Math.min(minValue, pixel);
        pixelIndex++;
    }

    // create dicom object and post it back to caller
    postMessage({
        bufferView: bufferView,
        min: minValue,
        max: maxValue
    });
};
