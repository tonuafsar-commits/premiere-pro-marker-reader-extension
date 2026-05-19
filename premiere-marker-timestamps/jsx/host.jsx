var MarkerTimestamps = MarkerTimestamps || {};

MarkerTimestamps.pad2 = function (value) {
  value = Math.floor(Number(value) || 0);
  return value < 10 ? "0" + value : String(value);
};

MarkerTimestamps.formatSeconds = function (seconds) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0));

  var hours = Math.floor(seconds / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var remainingSeconds = seconds % 60;

  if (hours > 0) {
    return MarkerTimestamps.pad2(hours) + ":" + MarkerTimestamps.pad2(minutes) + ":" + MarkerTimestamps.pad2(remainingSeconds);
  }

  return MarkerTimestamps.pad2(minutes) + ":" + MarkerTimestamps.pad2(remainingSeconds);
};

MarkerTimestamps.cleanMarkerName = function (name) {
  if (typeof name === "undefined" || name === null) {
    return "";
  }

  return String(name).replace(/[\r\n\t]+/g, " ").replace(/^\s+|\s+$/g, "");
};

MarkerTimestamps.getActiveSequenceName = function () {
  try {
    if (app && app.project && app.project.activeSequence && app.project.activeSequence.name) {
      return String(app.project.activeSequence.name);
    }
  } catch (error) {}

  return "Marker Timestamps";
};

MarkerTimestamps.sanitizeFileName = function (name) {
  name = MarkerTimestamps.cleanMarkerName(name);
  name = name.replace(/[\\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").replace(/^\.+|\.+$/g, "");

  if (!name) {
    return "Marker Timestamps";
  }

  return name;
};

MarkerTimestamps.formatMarkerLine = function (marker) {
  var timestamp = MarkerTimestamps.formatSeconds(MarkerTimestamps.getMarkerSeconds(marker));
  var name = MarkerTimestamps.cleanMarkerName(marker.name);

  if (name) {
    return timestamp + " - " + name;
  }

  return timestamp;
};

MarkerTimestamps.getMarkerSeconds = function (marker) {
  if (!marker || !marker.start) {
    return 0;
  }

  if (typeof marker.start.seconds !== "undefined") {
    return marker.start.seconds;
  }

  if (typeof marker.start.ticks !== "undefined") {
    return Number(marker.start.ticks) / 254016000000;
  }

  return 0;
};

MarkerTimestamps.getActiveSequenceMarkerTimes = function () {
  try {
    if (!app || !app.project) {
      return "ERROR:Premiere Pro project is not available.";
    }

    var sequence = app.project.activeSequence;
    if (!sequence) {
      return "ERROR:No active sequence found. Open a timeline and try again.";
    }

    if (!sequence.markers) {
      return "ERROR:This Premiere Pro version does not expose sequence markers to extensions.";
    }

    var markers = sequence.markers;
    var marker = markers.getFirstMarker();
    var timestamps = [];

    while (marker) {
      timestamps.push(MarkerTimestamps.formatMarkerLine(marker));
      marker = markers.getNextMarker(marker);
    }

    return timestamps.join("\n");
  } catch (error) {
    return "ERROR:" + error.toString();
  }
};

MarkerTimestamps.saveTextFile = function (content) {
  var file;

  try {
    var sequenceName = MarkerTimestamps.sanitizeFileName(MarkerTimestamps.getActiveSequenceName());
    var defaultFile = new File("~/Desktop/" + sequenceName + ".txt");

    file = defaultFile.saveDlg("Save marker timestamps", "Text Files:*.txt");

    if (!file) {
      return "CANCELLED";
    }

    if (!/\.txt$/i.test(file.fsName)) {
      file = new File(file.fsName + ".txt");
    }

    file.encoding = "UTF-8";

    if (!file.open("w")) {
      return "ERROR:Could not open the selected file for writing.";
    }

    file.write(content);
    file.close();

    return file.fsName;
  } catch (error) {
    try {
      if (file && file.opened) {
        file.close();
      }
    } catch (closeError) {}

    return "ERROR:" + error.toString();
  }
};
