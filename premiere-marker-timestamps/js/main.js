(function () {
  "use strict";

  var csInterface = new CSInterface();
  var scanButton = document.getElementById("scanButton");
  var copyButton = document.getElementById("copyButton");
  var exportButton = document.getElementById("exportButton");
  var output = document.getElementById("timestampOutput");
  var status = document.getElementById("status");

  function setStatus(message, type) {
    status.textContent = message;
    status.className = "status" + (type ? " " + type : "");
  }

  function updateCopyState() {
    var hasText = output.value.trim().length > 0;
    copyButton.disabled = !hasText;
    exportButton.disabled = !hasText;
  }

  function encodeForExtendScript(value) {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  function scanMarkers() {
    scanButton.disabled = true;
    setStatus("Scanning active sequence markers...", "");

    csInterface.evalScript("MarkerTimestamps.getActiveSequenceMarkerTimes()", function (result) {
      scanButton.disabled = false;

      if (typeof result === "string" && result.indexOf("ERROR:") === 0) {
        output.value = "";
        updateCopyState();
        setStatus(result.replace("ERROR:", ""), "error");
        return;
      }

      output.value = result || "";
      updateCopyState();

      if (output.value.trim().length === 0) {
        setStatus("No markers found in the active sequence.", "");
      } else {
        var count = output.value.split(/\r?\n/).filter(Boolean).length;
        setStatus(count + " marker" + (count === 1 ? "" : "s") + " found.", "success");
      }
    });
  }

  function fallbackCopy(text) {
    output.focus();
    output.select();
    return document.execCommand("copy");
  }

  function copyTimestamps() {
    var text = output.value.trim();

    if (!text) {
      setStatus("Nothing to copy yet.", "error");
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus("Copied timestamps to clipboard.", "success");
      }).catch(function () {
        if (fallbackCopy(text)) {
          setStatus("Copied timestamps to clipboard.", "success");
        } else {
          setStatus("Could not copy automatically. Select the list and press Ctrl+C.", "error");
        }
      });
      return;
    }

    if (fallbackCopy(text)) {
      setStatus("Copied timestamps to clipboard.", "success");
    } else {
      setStatus("Could not copy automatically. Select the list and press Ctrl+C.", "error");
    }
  }

  function exportTimestamps() {
    var text = output.value.trim();

    if (!text) {
      setStatus("Nothing to save yet.", "error");
      return;
    }

    exportButton.disabled = true;
    setStatus("Choose where to save the TXT file...", "");

    csInterface.evalScript("MarkerTimestamps.saveTextFile('" + encodeForExtendScript(text) + "')", function (result) {
      updateCopyState();

      if (typeof result === "string" && result.indexOf("ERROR:") === 0) {
        setStatus(result.replace("ERROR:", ""), "error");
        return;
      }

      if (result === "CANCELLED") {
        setStatus("Save cancelled.", "");
        return;
      }

      setStatus("Saved TXT file.", "success");
    });
  }

  scanButton.addEventListener("click", scanMarkers);
  copyButton.addEventListener("click", copyTimestamps);
  exportButton.addEventListener("click", exportTimestamps);
  output.addEventListener("input", updateCopyState);
  updateCopyState();
}());
