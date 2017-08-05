# trashbin

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC) [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/WebReflection/donate)

A ready to go file uploader for intranets.

`npm install -g trashbin`

### Usage

`trashbin [optional-folder]` creates a service to upload or download files in the provided folder or, by default, the current one.

As example, `trashbin ~/Downloads` will start a service to upload and download files through the `~/Download` folder.

#### IP and PORT

If specified as env variables, `trashbin` uses these instead.

As example, `PORT=3337 trashbin /tmp` will create a service with port `3337`

#### but ... why ?!

After I've connected my iPhone to my ArchLinux laptop and realized there was no easy way to grab my own content,
I've decided it was about the time to create this script that let's me upload whatever the heck I want on any machine I want inside my Home network.

Now even Windows Phones, old Androids, and Raspberry Pi can finally be uploaders or receivers.