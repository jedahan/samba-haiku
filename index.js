const fsevents = require('fsevents')
const path = require('path')
const boxen = require('boxen')
const bonjour = require('nbonjour').create()

const fs = require('fs')
const smbroot = path.join(__dirname, 'node_modules', 'node-smb-server', 'smbroot')
const watcher = fsevents(smbroot)

const initialHaiku = [ 'please share wonderful', 'haikus with recurse center', 'through this samba share' ]

fs.readdir(smbroot, (err, files) => {
  if (err) throw err

  for (const file of files) {
    fs.unlink(path.join(smbroot, file), err => {
      if (err) throw err
    })
  }
})

for (filename of initialHaiku) {
  fs.writeFileSync(path.join(smbroot, filename), '')
}

const haiku = []

watcher.on('change', (path, {type, event}) => {
  if (type !== 'file') return
  if (event !== 'moved-in') return

  const words = path.split('/')
  if (words.length !== 9) return

  const lines = haiku.map(({name}) => name.replace(/00[0-2] /, ''))
  while (haiku.length) haiku.pop().stop()

  if (lines.length == 3) lines.shift()

  lines.push(words[words.length-1])

  for (let i=0; i< lines.length; i++) {
    const name = `00${i} ${lines[i]}`
    const service = bonjour.publish({host: "talon.local", name, type: "smb", port: "445"})
    console.dir(service.fqdn)
    haiku.push(service)
  }

  console.log(boxen(haiku.map(({name}) => name).join('\n')))
})

setTimeout(() => watcher.start(), 1000)
