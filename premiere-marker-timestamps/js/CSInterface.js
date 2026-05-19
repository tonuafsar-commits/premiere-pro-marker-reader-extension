(function () {
  "use strict";

  function CSInterface() {}

  CSInterface.prototype.evalScript = function (script, callback) {
    if (window.__adobe_cep__ && typeof window.__adobe_cep__.evalScript === "function") {
      window.__adobe_cep__.evalScript(script, callback);
      return;
    }

    if (typeof callback === "function") {
      callback("ERROR:Adobe CEP interface is not available.");
    }
  };

  window.CSInterface = CSInterface;
}());
