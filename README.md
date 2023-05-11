# Controlnet-Scribbler
"Real-time" controlnet Scribble interface web-app.

## Demo
https://user-images.githubusercontent.com/39454485/235456001-b394357f-4552-43c2-aca8-8605810b09ca.mov

## Requirements
This is a front-end toy that assumes Stable diffusion + ControlNet is exposed as an API in the schema used in [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui).

Requests are sent to http://127.0.0.1:7860/sdapi/v1/txt2img.

## ‼️ WIP: Guide
Because the landscape for Stable Diffusion + ControlNet changes quite rapidly, it may be difficult to keep an updated guide for the best possible back-end setup.
A semi frozen fork of some valid implementation could be an option.

In the meantime, please see the links under **_Resources_**, or follow these informal steps:

### Rough guide
1. Install and run [vladmandic/automatic](https://github.com/vladmandic/automatic) (recommended because it's relatively smooth to set up, having some extensions incl. ControlNet out of the box). Alternatively, install [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) and [Mikubill/sd-webui-controlnet](https://github.com/Mikubill/sd-webui-controlnet).
2. Test ControlNet in the installed webui. If this is working properly you can close it and continue with the next step. Otherwise review step 1.
3. Restart webui.bat or equivalent with command line args to enable api and allow a CORS origin for the front-end, e.g. `--cors-allow-origins=127.0.0.1:3000`. If using [vladmandic/automatic](https://github.com/vladmandic/automatic), api is enabled by default and the argument for CORS origins is `--cors-origins`, or run `webui.bat --help` and check.
4. Host **index.html** with the allowed ip, e.g. run `python3 -m http.server 3000` in the directory of this repo.
5. Open http://127.0.0.1:3000 with your browser.

## Resources
- https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API
- https://github.com/Mikubill/sd-webui-controlnet/wiki/API#web-api
- https://github.com/vladmandic/automatic


