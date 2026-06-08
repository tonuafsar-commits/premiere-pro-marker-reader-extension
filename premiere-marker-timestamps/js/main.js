(function () {
  "use strict";

  var CURRENT_VERSION = "1.2.21";
  var UPDATE_CHECK_URL = "https://raw.githubusercontent.com/tonuafsar-commits/premiere-pro-marker-reader-extension/master/update.json";
  var UPDATE_CHECK_URLS = [
    "https://cdn.jsdelivr.net/gh/tonuafsar-commits/premiere-pro-marker-reader-extension@master/update.json",
    UPDATE_CHECK_URL,
    "https://api.github.com/repos/tonuafsar-commits/premiere-pro-marker-reader-extension/contents/update.json?ref=master"
  ];
  var UPDATE_DOWNLOAD_URL = "https://github.com/tonuafsar-commits/premiere-pro-marker-reader-extension/raw/refs/heads/master/dist/Marker-Timestamps-Complete-Package.zip";
  var csInterface = new CSInterface();
  var scanButton = document.getElementById("scanButton");
  var copyButton = document.getElementById("copyButton");
  var exportButton = document.getElementById("exportButton");
  var panel = document.getElementById("panel");
  var output = document.getElementById("timestampOutput");
  var status = document.getElementById("status");
  var updateNotice = document.getElementById("updateNotice");
  var updateText = document.getElementById("updateText");
  var checkUpdateButton = document.getElementById("checkUpdateButton");
  var downloadUpdateButton = document.getElementById("downloadUpdateButton");
  var creditLink = document.getElementById("creditLink");
  var successSound = document.getElementById("successSound");
  var currentOutputText = "";
  var currentMarkers = [];

  function setStatus(message, type) {
    status.textContent = message;
    status.className = "status" + (type ? " " + type : "");
  }

  function updateCopyState() {
    var hasText = currentOutputText.trim().length > 0;
    copyButton.disabled = !hasText;
    exportButton.disabled = !hasText;

    if (panel) {
      if (hasText) {
        panel.classList.add("is-scanned");
      } else {
        panel.classList.remove("is-scanned");
      }
    }
  }

  function encodeForExtendScript(value) {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  function normalizeTimestampText(value, lineBreak) {
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
      .join(lineBreak || "\n");
  }

  function normalizeTimestampLines(value) {
    return normalizeTimestampText(value, "\n");
  }

  function normalizeTimestampFileText(value) {
    return normalizeTimestampText(value, "\r\n");
  }

  function cleanMarkerName(value) {
    return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function parseTimestampSeconds(timestamp) {
    var parts = String(timestamp || "").split(":");
    var hours = 0;
    var minutes = 0;
    var seconds = 0;

    if (parts.length === 2) {
      minutes = parseInt(parts[0], 10);
      seconds = parseInt(parts[1], 10);
    } else if (parts.length === 3) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      seconds = parseInt(parts[2], 10);
    } else {
      return null;
    }

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null;
    }

    return (hours * 3600) + (minutes * 60) + seconds;
  }

  function parseTimestampLine(line) {
    var match = String(line || "").match(/^(\d{2}(?::\d{2}){1,2})(?:\s+-\s+(.*))?$/);
    var seconds;

    if (!match) {
      return null;
    }

    seconds = parseTimestampSeconds(match[1]);
    if (seconds === null) {
      return null;
    }

    return {
      time: match[1],
      name: match[2] || "",
      seconds: seconds,
      line: String(line || "")
    };
  }

  function markersFromText(text) {
    return normalizeTimestampLines(text)
      .split("\n")
      .map(parseTimestampLine)
      .filter(function (item) {
        return !!item;
      });
  }

  function duplicateNameKey(name) {
    return String(name || "").replace(/^\s+|\s+$/g, "").toLowerCase();
  }

  function markDuplicateNames(markers) {
    var counts = {};
    var key;

    markers.forEach(function (marker) {
      key = duplicateNameKey(marker.name);

      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    markers.forEach(function (marker) {
      key = duplicateNameKey(marker.name);
      marker.isDuplicateName = !!(key && counts[key] > 1);
    });

    return markers;
  }

  function markerLine(marker) {
    if (marker && marker.line) {
      return marker.line;
    }

    if (marker && marker.name) {
      return marker.time + " - " + marker.name;
    }

    return marker ? marker.time : "";
  }

  function refreshCurrentOutputFromMarkers(markers) {
    currentMarkers = markers || [];
    currentOutputText = normalizeTimestampLines(currentMarkers.map(markerLine).join("\n"));
  }

  function setRowBadge(row, text, className) {
    var badge = row.querySelector(".duplicateBadge");

    if (!badge) {
      return;
    }

    badge.textContent = text || "";
    badge.className = "duplicateBadge" + (className ? " " + className : "");
  }

  function updateEditableMarkerName(marker, input, row) {
    var nextName = cleanMarkerName(input.value);
    var previousName = input.getAttribute("data-synced-name") || "";

    input.value = nextName || "(unnamed marker)";

    if (nextName === previousName) {
      return;
    }

    input.disabled = true;
    setRowBadge(row, "saving", "saving");

    csInterface.evalScript(
      "MarkerTimestamps.updateSequenceMarkerName(" + Number(marker.seconds || 0) + ", '" + encodeForExtendScript(nextName) + "')",
      function (result) {
        input.disabled = false;

        if (typeof result === "string" && result.indexOf("ERROR:") === 0) {
          input.value = previousName || "(unnamed marker)";
          setRowBadge(row, "error", "");
          setStatus(result.replace("ERROR:", ""), "error");
          return;
        }

        marker.name = nextName;
        marker.line = nextName ? marker.time + " - " + nextName : marker.time;
        input.setAttribute("data-synced-name", nextName);
        refreshCurrentOutputFromMarkers(currentMarkers);
        updateCopyState();
        setRowBadge(row, "synced", "synced");
        setStatus("Timeline marker updated at " + marker.time + ".", "success");

        window.setTimeout(function () {
          if (row.parentNode) {
            renderOutput(currentMarkers);
          }
        }, 900);
      }
    );
  }

  function seekToMarker(seconds, label) {
    var value = Number(seconds);

    if (isNaN(value)) {
      setStatus("Could not read that marker time.", "error");
      return;
    }

    csInterface.evalScript("MarkerTimestamps.seekToSeconds(" + value + ")", function (result) {
      if (typeof result === "string" && result.indexOf("ERROR:") === 0) {
        setStatus(result.replace("ERROR:", ""), "error");
        return;
      }

      setStatus("Playhead moved to " + label + ".", "success");
    });
  }

  function renderOutput(markers) {
    var items = markDuplicateNames(markers || markersFromText(currentOutputText));

    output.innerHTML = "";

    if (!items.length) {
      var placeholder = document.createElement("span");
      placeholder.className = "outputPlaceholder";
      placeholder.innerHTML = "00:15 - Intro<br>01:42 - Product closeup<br>03:08 - End screen";
      output.appendChild(placeholder);
      return;
    }

    items.forEach(function (marker, index) {
      var row = document.createElement("div");
      var button = document.createElement("button");
      var name = document.createElement("input");
      var duplicateBadge;

      row.className = "timestampRow";
      row.style.animationDelay = Math.min(420, 90 + (index * 35)) + "ms";
      button.className = "timestampJump";
      button.type = "button";
      button.textContent = marker.time;
      button.title = "Move playhead to " + marker.time;
      name.className = "timestampName";
      name.type = "text";
      name.value = marker.name || "(unnamed marker)";
      name.setAttribute("data-synced-name", cleanMarkerName(marker.name));
      name.setAttribute("spellcheck", "false");
      name.title = "Edit this marker name in the active Premiere timeline.";

      duplicateBadge = document.createElement("span");
      duplicateBadge.className = "duplicateBadge";

      if (marker.isDuplicateName) {
        duplicateBadge.textContent = "(!)";
        duplicateBadge.title = "This marker name is used more than once.";
      }

      button.addEventListener("click", function () {
        seekToMarker(marker.seconds, marker.time);
      });

      name.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          name.blur();
        }
      });

      name.addEventListener("focus", function () {
        name.select();
      });

      name.addEventListener("blur", function () {
        updateEditableMarkerName(marker, name, row);
      });

      row.appendChild(button);
      row.appendChild(name);
      row.appendChild(duplicateBadge);
      output.appendChild(row);
    });
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
    setStatus("Update available: version " + latestVersion + ".", "success");
  }

  function checkForUpdates(showUpToDateMessage) {
    var urls = UPDATE_CHECK_URLS.slice(0);
    var bestUpdate = null;

    function tryNextUrl() {
      var request;
      var url;

      if (!urls.length) {
        if (bestUpdate && compareVersions(bestUpdate.version, CURRENT_VERSION) > 0) {
          showUpdateNotice(bestUpdate.version, bestUpdate.message || "", bestUpdate.downloadUrl || bestUpdate.url || UPDATE_DOWNLOAD_URL);
          return;
        }

        if (showUpToDateMessage) {
          setStatus(bestUpdate ? "You have the latest version." : "Could not check for updates. Please check your internet connection.", bestUpdate ? "success" : "error");
        }
        return;
      }

      request = new XMLHttpRequest();
      url = urls.shift() + "?t=" + new Date().getTime();

      request.open("GET", url, true);
      request.timeout = 6000;

      request.onreadystatechange = function () {
        if (request.readyState !== 4) {
          return;
        }

        if (request.status < 200 || request.status >= 300) {
          tryNextUrl();
          return;
        }

        try {
          var data = parseUpdateResponse(request.responseText);
          var latestVersion = data.version || data.latestVersion;

          if (latestVersion && (!bestUpdate || compareVersions(latestVersion, bestUpdate.version) > 0)) {
            bestUpdate = data;
            bestUpdate.version = latestVersion;
          }

          tryNextUrl();
        } catch (error) {
          tryNextUrl();
        }
      };

      request.onerror = tryNextUrl;
      request.ontimeout = tryNextUrl;
      request.send();
    }

    tryNextUrl();
  }

  function parseUpdateResponse(responseText) {
    var data = JSON.parse(responseText);

    if (data && data.encoding === "base64" && data.content) {
      return JSON.parse(atob(String(data.content).replace(/\s/g, "")));
    }

    return data;
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
    var result = window.cep.fs.writeFile(path, normalizeTimestampFileText(text), encoding);

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
    csInterface.evalScript("MarkerTimestamps.saveTextFile('" + encodeForExtendScript(normalizeTimestampFileText(text)) + "')", function (result) {
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
    if (panel) {
      panel.classList.add("is-scanned");
    }
    setStatus("Scanning active sequence markers...", "");

    csInterface.evalScript("MarkerTimestamps.getActiveSequenceMarkersJson()", function (result) {
      var markers;
      var lines;

      scanButton.disabled = false;

      if (typeof result === "string" && result.indexOf("ERROR:") === 0) {
        currentMarkers = [];
        currentOutputText = "";
        renderOutput([]);
        updateCopyState();
        setStatus(result.replace("ERROR:", ""), "error");
        return;
      }

      try {
        markers = JSON.parse(result || "[]");
      } catch (error) {
        markers = markersFromText(result || "");
      }

      lines = markers.map(markerLine);
      currentMarkers = markers;
      currentOutputText = normalizeTimestampLines(lines.join("\n"));
      renderOutput(markers);
      updateCopyState();

      if (currentOutputText.trim().length === 0) {
        if (panel) {
          panel.classList.remove("is-scanned");
        }
        setStatus("No markers found in the active sequence.", "");
      } else {
        var count = currentOutputText.split(/\r?\n/).filter(Boolean).length;
        setStatus(count + " sequence marker" + (count === 1 ? "" : "s") + " found.", "success");
      }
    });
  }

  function fallbackCopy(text) {
    var temporaryInput = document.createElement("textarea");
    var copied;

    temporaryInput.value = normalizeTimestampFileText(text);
    temporaryInput.setAttribute("readonly", "readonly");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.left = "-9999px";
    document.body.appendChild(temporaryInput);
    temporaryInput.focus();
    temporaryInput.select();

    copied = document.execCommand("copy");
    document.body.removeChild(temporaryInput);
    return copied;
  }

  function copyTimestamps() {
    var text = normalizeTimestampFileText(currentOutputText);

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
    var text = normalizeTimestampFileText(currentOutputText);

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
  creditLink.addEventListener("click", function (event) {
    event.preventDefault();
    openExternalUrl(creditLink.href);
  });
  updateCopyState();
  renderOutput([]);
  checkForUpdates(false);
}());
