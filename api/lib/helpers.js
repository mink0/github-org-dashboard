export { log, formatBytes, truncStr, getDs, getDTs, userUrl, panic }

function log(text) {
  const args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments)
  const format = args.slice(1)

  const ts = getDTs()
  format.unshift(`[${ts}] ${text}`)

  // eslint-disable-next-line no-console
  console.error(...format)
}

function panic(err) {
  // eslint-disable-next-line no-console
  console.log(err)

  process.exit(1)
}

function getDTs() {
  const t = new Date()

  return `${getDs(t)} ${getTs(t)}`
}

function getTs(date) {
  let d = date
  if (typeof date === 'string') d = new Date(date)

  if (!d) return '-'

  let hour = d.getHours()
  let min = d.getMinutes()
  let sec = d.getSeconds()

  hour = (hour < 10 ? '0' : '') + hour
  min = (min < 10 ? '0' : '') + min
  sec = (sec < 10 ? '0' : '') + sec

  return `${hour}:${min}:${sec}`
}

function getDs(date) {
  let d = date
  if (typeof d === 'string') d = new Date(date)

  if (!date) return '-'

  const year = d.getFullYear()
  let day = d.getDate()
  let month = d.getMonth() + 1

  month = (month < 10 ? '0' : '') + month
  day = (day < 10 ? '0' : '') + day

  return `${day}-${month}-${year}`
}

function get(obj, path, defaultValue) {
  return path.split('.').reduce((a, c) => (a && a[c] ? a[c] : defaultValue || null), obj)
}

function formatBytes(bytes, decimals) {
  if (bytes === 0) return '0 Bytes'

  const kb = 1024
  const dm = decimals <= 0 ? 0 : decimals || 2
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(kb))

  return `${parseFloat((bytes / kb ** i).toFixed(dm))} ${sizes[i]}`
}

function truncStr(str, num) {
  if (str.length <= num) return str

  return `${str.slice(0, num)}...`
}

function userUrl(user, size) {
  if (!user) return ''

  const iSize = size || 20

  const url = get(user, 'url')
  const avatarUrl = get(user, 'avatarUrl')
  const login = get(user, 'login')

  return `<a href="${url}"><img height="${iSize}" width="${iSize}" src="${avatarUrl}"/>&nbsp;${login}</a>`
}
