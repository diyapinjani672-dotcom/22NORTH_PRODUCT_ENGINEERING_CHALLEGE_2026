/** Simple barcode visualization without external deps */
export default function BarcodeDisplay({ data }) {
  const bars = []
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i)
    bars.push(code % 3 === 0 ? 3 : code % 3 === 1 ? 2 : 1)
  }

  return (
    <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
      <div className="flex items-end gap-px h-16">
        {bars.map((w, i) => (
          <div key={i} className="bg-night" style={{ width: w, height: '100%' }} />
        ))}
      </div>
      <p className="font-mono text-xs text-night tracking-widest break-all text-center max-w-full">{data}</p>
    </div>
  )
}
