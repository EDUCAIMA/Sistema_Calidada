// macOS-only visual QA fallback when Poppler is not installed.
// swift scripts/render-pdf-qa.swift input.pdf output-directory
import Foundation
import PDFKit
import AppKit

guard CommandLine.arguments.count == 3,
      let document = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])) else {
    fatalError("Usage: render-pdf-qa.swift input.pdf output-directory")
}
let directory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { fatalError("Missing page") }
    let size = page.bounds(for: .mediaBox).size
    let image = page.thumbnail(of: NSSize(width: size.width * 1.5, height: size.height * 1.5), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let data = bitmap.representation(using: .png, properties: [:]) else { fatalError("Could not render page") }
    try data.write(to: directory.appendingPathComponent("page-\(index + 1).png"))
}
print("Rendered \(document.pageCount) pages")
