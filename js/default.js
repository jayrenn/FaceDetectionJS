(function () {
    "use strict";

    var mediaCapture;
    var Capture = Windows.Media.Capture;
    var DeviceEnumeration = Windows.Devices.Enumeration;
    var effectDefinition = new Windows.Media.Core.FaceDetectionEffectDefinition();
    var mediaStreamType = Capture.MediaStreamType.videoRecord;
    var captureSettings = new Capture.MediaCaptureInitializationSettings;
    var displayRequest = new Windows.System.Display.DisplayRequest();
    var faceboxColors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"];

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
        return DeviceEnumeration.DeviceInformation.findAllAsync(DeviceEnumeration.DeviceClass.videoCapture).then(
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

    findCameraDeviceByPanelAsync(DeviceEnumeration.Panel.back).then(
        function (camera) {
            if (camera === null) {
                console.error("No camera device found!");
                return;
            }

            mediaCapture = new Capture.MediaCapture();
            captureSettings.videoDeviceId = camera.id;
            captureSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
            mediaCapture.initializeAsync(captureSettings).then(
                function fulfilled(result) {
                    mediaCapture.addVideoEffectAsync(effectDefinition, mediaStreamType).done(
                        function complete(result) {
                            result.addEventListener("facedetected", handleFaces);
                        },
                        function error(e) {
                            console.error("Error: " + e);
                        }
                    );

                    displayRequest.requestActive();
                    var preview = document.getElementById("cameraPreview");
                    var previewUrl = URL.createObjectURL(mediaCapture);
                    preview.src = previewUrl;
                    preview.play();
                },
                function error(e) {
                    console.error("Error: " + e);
                }
            );
        }
    );
})();
