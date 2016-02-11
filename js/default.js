(function () {
    "use strict";

    var mediaCapture;
    var faceDetectionEffectDefinition = new Windows.Media.Core.FaceDetectionEffectDefinition();
    var mediaStreamType = Windows.Media.Capture.MediaStreamType.videoRecord;
    var mediaCaptureInitializationSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings;
    var displayRequest = new Windows.System.Display.DisplayRequest();
    var faceboxColors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"]

    function createFacebox(face, num) {
        var facebox = document.createElement("div");
        facebox.style.width = face.width + "px";
        facebox.style.height = face.height + "px";
        facebox.style.top = face.y + "px";
        facebox.style.left = face.x + "px";
        facebox.style.borderColor = faceboxColors[num % faceboxColors.length];
        facebox.classList.add("facebox");
        document.getElementById("video").appendChild(facebox);
    }

    function findCameraDeviceByPanelAsync(panel) {
        var deviceInfo;
        return Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(
            function (devices) {
                devices.forEach(function (cameraDeviceInfo) {
                    if (cameraDeviceInfo.enclosureLocation != null && cameraDeviceInfo.enclosureLocation.panel === panel) {
                        deviceInfo = cameraDeviceInfo;
                        return;
                    }
                });

                if (!deviceInfo && devices.length > 0) {
                    deviceInfo = devices.getAt(0);
                }

                return deviceInfo;
            }
        );
    }

    function handleFaces(args) {
        removeAllFaceboxes();

        var detectedFaces = args.resultFrame.detectedFaces;
        if (detectedFaces.length > 0) {
            for (var i = 0; i < detectedFaces.length; i++) {
                var face = detectedFaces.getAt(i).faceBox;
                createFacebox(face, i);
            }
        }
    }

    function removeAllFaceboxes() {
        var faceboxes = document.querySelectorAll(".facebox");

        for (var i = faceboxes.length - 1; i >= 0; i--) {
            if (faceboxes[i].parentNode) {
                faceboxes[i].parentNode.removeChild(faceboxes[i]);
            }
        }
    }

    findCameraDeviceByPanelAsync(Windows.Devices.Enumeration.Panel.back).then(
        function (camera) {
            if (camera === null) {
                console.error("No camera device found!");
                return;
            }

            mediaCapture = new Windows.Media.Capture.MediaCapture();
            mediaCaptureInitializationSettings.videoDeviceId = camera.id;
            mediaCaptureInitializationSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;
            mediaCapture.initializeAsync(mediaCaptureInitializationSettings).then(
                function fulfilled(result) {
                    mediaCapture.addVideoEffectAsync(faceDetectionEffectDefinition, mediaStreamType).done(
                        function complete(result) {
                            result.addEventListener("facedetected", handleFaces);
                        },
                        function error(e) {
                            console.error("Video effect error: " + e);
                        }
                    );

                    // displayRequest.requestActive();

                    var preview = document.getElementById("cameraPreview");
                    var previewUrl = URL.createObjectURL(mediaCapture);
                    preview.src = previewUrl;
                    preview.play();
                },
                function error(e) {
                    console.error("Initialize error: " + e);
                }
            );
        }
    );
})();