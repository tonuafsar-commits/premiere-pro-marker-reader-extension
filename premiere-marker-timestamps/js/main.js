(function () {
  "use strict";

  var CURRENT_VERSION = "1.2.5";
  var UPDATE_CHECK_URL = "https://raw.githubusercontent.com/tonuafsar-commits/premiere-pro-marker-reader-extension/master/update.json";
  var UPDATE_DOWNLOAD_URL = "https://github.com/tonuafsar-commits/premiere-pro-marker-reader-extension/raw/refs/heads/master/dist/Marker-Timestamps-Complete-Package.zip";
  var csInterface = new CSInterface();
  var scanButton = document.getElementById("scanButton");
  var copyButton = document.getElementById("copyButton");
  var exportButton = document.getElementById("exportButton");
  var checkUpdateButton = document.getElementById("checkUpdateButton");
  var output = document.getElementById("timestampOutput");
  var status = document.getElementById("status");
  var updateNotice = document.getElementById("updateNotice");
  var updateText = document.getElementById("updateText");
  var downloadUpdateButton = document.getElementById("downloadUpdateButton");
  var successSound = document.getElementById("successSound");

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

  function normalizeTimestampLines(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(function (line) {
        return line.replace(/^\s+|\s+$/g, "");
      })
      .filter(function (line) {
        return line.length > 0;
      })
      .join("\r\n");
  }

  function compareVersions(left, right) {
    var leftParts = String(left || "0").split(".");
    var rightParts = String(right || "0").split(".");
    var maxLength = Math.max(leftParts.length, rightParts.length);
    var index;

    for (index = 0; index < maxLength; index += 1) {
      var leftNumber = parseInt(leftParts[index] || "0", 10);
      var rightNumber = parseInt(rightParts[index] || "0", 10);

      if (leftNumber > rightNumber) {
        return 1;
      }

      if (leftNumber < rightNumber) {
        return -1;
      }
    }

    return 0;
  }

  function openExternalUrl(url) {
    if (window.cep && window.cep.util && typeof window.cep.util.openURLInDefaultBrowser === "function") {
      window.cep.util.openURLInDefaultBrowser(url);
      return;
    }

    window.open(url, "_blank");
  }

  function showUpdateNotice(latestVersion, message, downloadUrl) {
    updateText.textContent = "Version " + latestVersion + " is available." + (message ? " " + message : "");
    downloadUpdateButton.setAttribute("data-url", downloadUrl || UPDATE_DOWNLOAD_URL);
    updateNotice.hidden = false;
  }

  function checkForUpdates(showUpToDateMessage) {
    var request = new XMLHttpRequest();
    var url = UPDATE_CHECK_URL + "?t=" + new Date().getTime();

    request.open("GET", url, true);
    request.timeout = 5000;

    request.onreadystatechange = function () {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        if (showUpToDateMessage) {
          setStatus("Could not check for updates.", "error");
        }
        return;
      }

      try {
        var data = JSON.parse(request.responseText);
        var latestVersion = data.version || data.latestVersion;

        if (latestVersion && compareVersions(latestVersion, CURRENT_VERSION) > 0) {
          showUpdateNotice(latestVersion, data.message || "", data.downloadUrl || data.url || UPDATE_DOWNLOAD_URL);
        } else if (showUpToDateMessage) {
          setStatus("You have the latest version.", "success");
        }
      } catch (error) {
        if (showUpToDateMessage) {
          setStatus("Could not read update information.", "error");
        }
      }
    };

    request.ontimeout = function () {
      if (showUpToDateMessage) {
        setStatus("Update check timed out.", "error");
      }
    };

    request.send();
  }

  function playFallbackChime() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    try {
      var context = new AudioContext();
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, now);
      oscillator.frequency.setValueAtTime(980, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.34);
    } catch (error) {}
  }

  function playSaveSuccessSound() {
    if (!successSound) {
      playFallbackChime();
      return;
    }

    if (successSound && successSound.play) {
      try {
        successSound.currentTime = 0;
        successSound.volume = 0.85;
        var playResult = successSound.play();

        if (playResult && playResult.catch) {
          playResult.catch(function () {
            playFallbackChime();
          });
        }

        return;
      } catch (error) {}
    }

    playFallbackChime();
  }

  function ensureTxtExtension(path) {
    if (!/\.txt$/i.test(path)) {
      return path + ".txt";
    }

    return path;
  }

  function getDialogPath(result) {
    if (!result || result.err) {
      return "";
    }

    if (typeof result.data === "string") {
      return result.data;
    }

    if (result.data && result.data.length) {
      return result.data[0];
    }

    return "";
  }

  function canUseCepSaveDialog() {
    return window.cep && window.cep.fs &&
      (typeof window.cep.fs.showSaveDialogEx === "function" || typeof window.cep.fs.showSaveDialog === "function") &&
      typeof window.cep.fs.writeFile === "function";
  }

  function writeCepFile(path, text) {
    var encoding = window.cep.encoding && window.cep.encoding.UTF8 ? window.cep.encoding.UTF8 : "UTF-8";
    var result = window.cep.fs.writeFile(path, normalizeTimestampLines(text), encoding);

    if (result && result.err === 0) {
      return true;
    }

    return false;
  }

  function saveWithCepDialog(text, suggestedName) {
    var dialogResult;
    var path;

    try {
      if (typeof window.cep.fs.showSaveDialogEx === "function") {
        dialogResult = window.cep.fs.showSaveDialogEx(
          "Save marker timestamps",
          "",
          suggestedName,
          ["txt"],
          "Text Files"
        );
      } else {
        dialogResult = window.cep.fs.showSaveDialog(
          "Save marker timestamps",
          "",
          suggestedName,
          ["txt"]
        );
      }

      path = ensureTxtExtension(getDialogPath(dialogResult));

      if (!path) {
        setStatus("Save cancelled.", "");
        return;
      }

      if (writeCepFile(path, text)) {
        setStatus("Saved TXT file.", "success");
        playSaveSuccessSound();
      } else {
        setStatus("Could not write the selected TXT file.", "error");
      }
    } catch (error) {
      saveWithHostDialog(text);
    }
  }

  function saveWithHostDialog(text) {
    csInterface.evalScript("MarkerTimestamps.saveTextFile('" + encodeForExtendScript(normalizeTimestampLines(text)) + "')", function (result) {
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
      playSaveSuccessSound();
    });
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
    var originalValue = output.value;

    output.value = normalizeTimestampLines(text);
    output.focus();
    output.select();

    var copied = document.execCommand("copy");
    output.value = originalValue;
    return copied;
  }

  function copyTimestamps() {
    var text = normalizeTimestampLines(output.value);

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
    var text = normalizeTimestampLines(output.value);

    if (!text) {
      setStatus("Nothing to save yet.", "error");
      return;
    }

    exportButton.disabled = true;
    setStatus("Choose where to save the TXT file...", "");

    csInterface.evalScript("MarkerTimestamps.getSuggestedTxtFileName()", function (suggestedName) {
      updateCopyState();

      if (typeof suggestedName === "string" && suggestedName.indexOf("ERROR:") === 0) {
        saveWithHostDialog(text);
        return;
      }

      if (canUseCepSaveDialog()) {
        saveWithCepDialog(text, suggestedName || "Marker Timestamps.txt");
        return;
      }

      saveWithHostDialog(text);
    });
  }

  scanButton.addEventListener("click", scanMarkers);
  copyButton.addEventListener("click", copyTimestamps);
  exportButton.addEventListener("click", exportTimestamps);
  checkUpdateButton.addEventListener("click", function () {
    setStatus("Checking for updates...", "");
    checkForUpdates(true);
  });
  downloadUpdateButton.addEventListener("click", function () {
    openExternalUrl(downloadUpdateButton.getAttribute("data-url") || UPDATE_DOWNLOAD_URL);
  });
  output.addEventListener("input", updateCopyState);
  updateCopyState();
  checkForUpdates(false);
}());
