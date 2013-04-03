# TopProcess Sidebar Gadget

This is a gadget for the Windows Sidebar gadget platform featured in Windows Vista and Windows 7. Note that Sidebar has been removed from Windows 8.

This gadget shows the top processes on your system - the processes that are consuming the most CPU, Memory (Working Set), or IO (Bytes Written/Read). By default it shows the top three processes by CPU, but it can be configured to show more or less. Multiple instances of the gadget can be run at once to show different stats.

## Install

[Install the latest version of TopProcess](http://benhollis.net/software/sidebargadgets/TopProcess.gadget)

## Localization

TopProcess is currently translated into English, Italian, Japanese, French and Russian. Translating to a new language is easy - create a new folder named after your locale, and create a localized version of `gadget.xml` and `Settings.html`. Pull requests are welcome.

## Development & Contribution

Pull requests are welcome! Bug reports are not - if you find a problem, please fix it and send a pull request. The easiest way to work on the gadget is to check it out directly into `C:\Users\<your username>\AppData\Local\Microsoft\Windows Sidebar\Gadgets` and work on it there. You can remove the gadget and re-add it to see updated code. Building the gadget installer can be done via Ant, but that's only necessary if you want to distribute the gadget.


## License

TopProcess is open source software licensed under the MIT License. &copy; 2007 Benjamin Hollis.