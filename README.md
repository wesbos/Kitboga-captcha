# Kitboga Code Jam
"I'm not a robot!"

This GitHub repository contains a template you should fork, modify to include your captcha, and then submit to us. Please read all the information in this readme before getting started!
**The deadline for submissions is 27th June 2025!**

## Rules
1. Follow the guidelines in `captcha/captcha.html` as to where and how your code should be written.
2. It goes without saying, but no malicious code. We want to frustrate and anger scammers, but it's no fun if we just crash their browser, and we're not interested in doing anything illegal. Specifically:
    - No resource-hogs
    - No crypto mining
    - No fork bombs or similar
    - No attempting to reveal their personal information
    - No exploits
    - No payload deployment
    - No attempts to collect or display personal information
3. Please try to match the tone of the Kitboga community. You are very unlikely to be selected if your submission contains:
    - Bad language (this will spook a scammer right away)
    - Racism, or basically any other -ism
    - Vulgarity or anything NSFW
    - Anything which would violate the Twitch or YouTube TOS. If you are unsure where this line is, then better to stay on the safe side.
4. Please don't use copyrighted logos or brand names in your submission. If you have an idea for something incredible which only works with a particular brand, check with us in Discord.
5. No obfuscation. If we can't read or understand the code, we're probably not going to run it.
6. No requests for resources outside of your repository, except for well-known javascript libraries from a CDN (jsdelivr, unpkg, googleapis, etc). Aside from these, include all the assets you need in your repository, such as fonts, icons and everything else. If you have a specific idea which requires access to the Internet, perhaps to fetch live stock market data for example, then try to fake it. If it's important to you to make external requests, talk to us about it in Discord.
7. When submitting your code, please tell us about every feature, even "easter eggs". No surprises!
8. WebAssembly and Web Workers are not allowed.
9. Do not include minified code; this includes code generated from build tools like Vite (see also [disabling minification](https://vite.dev/config/build-options#build-minify)) or WebPack. Prefer not using any build tools, if possible.

## Discord
Please feel free to join the Kitboga discord, and hang out in the #code-jam channel. That's a great place to ask for help, and it will be useful if we need to contact you about your submission for whatever reason.
https://discord.com/kitboga

## Getting Started
1. Create a GitHub repository from the template: https://github.com/new?template_name=codejam25&template_owner=The-Kitboga-Show
2. Clone the new repository locally to your machine
3. Open the "game shell" in your browser; this can be done in 2 ways:
   - By opening `index.html` directly in your browser
   - By running a local webserver (this can help with testing on different devices too). One easy way to do this, if you have python installed, is to run this command in the terminal: `python3 -m http.server 8000`. Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser (the port may vary if you used a different method to start a web server).
4. Create your game in `captcha/captcha.html`! All parts of your submission should be in the `captcha/` folder.
5. Commit and push your changes
6. See the "How to Submit" section below

## Advice
1. Scammers are often using iPhones, so make sure your CAPTCHA works properly in that format. They also use desktops, usually with Chrome or Edge, so it's a good idea to make sure it works well in a desktop format also. (See also [device mode on Chrome](https://developer.chrome.com/docs/devtools/device-mode/), or [responsive design mode on Firefox](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/).)

2. The best submissions will be ones which are fun to watch, and also irritating for the scammer. They should be designed so that the scammer finds them difficult or confusing to complete, but they should eventually be completable, within around 5 minutes. Having some element of skill (rather than only chance) is more likely to keep a scammer hooked and actively trying to pass your CAPTCHA.

3. If you want to go the extra mile, having some configuration in the code which increases or decreases the difficulty could be a nice touch.

4. We will prefer human-generated content. Feel free to use some AI during development, but don't just ask it to come up with and create an idea.

## Forbidden APIs and functions
Please don't use any of the following:
- navigator.geolocation
- navigator.getUserMedia()
- navigator.connection
- navigator.clipboard
- navigator.bluetooth
- navigator.usb
- navigator.serial
- navigator.requestMIDIAccess
- window.showOpenFilePicker()
- window.showSaveFilePicker()
- navigator.serviceWorker
- window.open()
- window.print()
- navigator.permissions
- navigator.credentials
- RTCPeerConnection
- fetch, XMLHttpRequest, WebSocket, etc.

## Examples
- [Crow Lifting Weights](https://courageousmayonnaise.github.io/codejam25-crow-lifting-weights/) ([source](https://github.com/CourageousMayonnaise/codejam25-crow-lifting-weights))
- [Scratch Off Game](https://courageousmayonnaise.github.io/codejam25-scratch-off/) ([source](https://github.com/CourageousMayonnaise/codejam25-scratch-off))
- Anti-Example: [Cube Game](https://courageousmayonnaise.github.io/codejam25-cube-game/) ([source](https://github.com/CourageousMayonnaise/codejam25-cube-game))
  - *Why is this an anti-example?* This game uses copyrighted material and is not an original creation. It also lacks a clear solution.

## Prizes and Judging
Entries will shortlisted by a panel of Kitboga Show team members, and will be judged subjectively based on originality, technical merit, entertainment value and style. The best will go forward to a final round where they will be tried with scammers live on-stream. There may be prizes, including things such as merch, signed items, and gift cards.

## How to submit
**Remember, the deadline is 27th June 2025!**
Don't forget to read the license in TERMS.md, which you'll need to agree to in order to take part.

Go here: https://kitboga.com/codejam

## (Optional) Live Demo
Add a publicly viewable demo for your CAPTCHA by enabling GitHub Pages in your repository settings. Navigate to `Settings` > `Pages`, then under `Branch`, select `main`, and then press `Save`. Once the site is built the URL will appear.

## Further help
Drop into the Kitboga discord server, and check out the #code-jam channel. Please don't ask questions via email, as we might not see them before the deadline.
