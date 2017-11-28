# VERA viewer
![](https://raw.githubusercontent.com/lpenguin/microbiota-resistome-viewer/master/pictures/Peek%202017-11-28%2015-28.gif)
## Dependicies

* NodeJS v6.x.x
* Electron v1.6.11

## Building

* Install packages

```bash
cd <repo>
npm install
```

* Running app

```bash
electron .
```

* Building packages

```bash
npm run package-linux  # Linux package
npm run package-win  # Windows package
npm run package-mac  # MacOS package
```

## Usage

```bash
usage: vera-viewer [-h] [-a ABUNDANCE_FILE] [-t TRANSLOG_FILE]

optional arguments:
    -h                  show this help message and exit
    -a ABUNDANCE_FILE   abundance file
    -t TRANSLOG_FILE    translog file
```
