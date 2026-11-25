/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2256b0741c0f487c6b0d6d730cade2cd"
  }, {
    "url": "pwa-512x512.png",
    "revision": "126ac665d3d07cc03b7bfa5607b7a3f0"
  }, {
    "url": "pwa-192x192.png",
    "revision": "bb73de375594a161517fb1b3bb40dcbd"
  }, {
    "url": "index.html",
    "revision": "3c903279f1793a4eb934308d43bbe692"
  }, {
    "url": "icon.svg",
    "revision": "6aa845cec0a422413ebbc7a8427dae50"
  }, {
    "url": "favicon.ico",
    "revision": "41be97849736a580c3ac1711ed9f2824"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c7b2bb39881afaf017f35a85513cd43d"
  }, {
    "url": "assets/purify.es-CAi2OJFm.js",
    "revision": null
  }, {
    "url": "assets/index.es-BqwUeVKj.js",
    "revision": null
  }, {
    "url": "assets/index-lbj-ZT2J.css",
    "revision": null
  }, {
    "url": "assets/index-Idt4tWOi.js",
    "revision": null
  }, {
    "url": "assets/aistudio/image_a9b019fb.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_0fc9d68e.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_7859_946b6be6.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c7b2bb39881afaf017f35a85513cd43d"
  }, {
    "url": "favicon.ico",
    "revision": "41be97849736a580c3ac1711ed9f2824"
  }, {
    "url": "icon.svg",
    "revision": "6aa845cec0a422413ebbc7a8427dae50"
  }, {
    "url": "pwa-192x192.png",
    "revision": "bb73de375594a161517fb1b3bb40dcbd"
  }, {
    "url": "pwa-512x512.png",
    "revision": "126ac665d3d07cc03b7bfa5607b7a3f0"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2256b0741c0f487c6b0d6d730cade2cd"
  }, {
    "url": "manifest.webmanifest",
    "revision": "556c8a2ead0e052e4846bba8e6d6d1da"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /\.exe$/i, /\.zip$/i, /\.msi$/i, /^\/Smart-Ledger/i, /^\/download/i]
  }));

}));
