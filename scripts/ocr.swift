import AppKit
import CoreGraphics
import Foundation
import PDFKit
import Vision

enum OCRScriptError: Error {
    case missingInput
    case unsupportedFormat
    case cannotLoadImage
}

func sortedRecognizedText(from observations: [VNRecognizedTextObservation]) -> String {
    let sorted = observations.sorted { left, right in
        let leftY = left.boundingBox.midY
        let rightY = right.boundingBox.midY
        if abs(leftY - rightY) > 0.03 {
            return leftY > rightY
        }

        return left.boundingBox.minX < right.boundingBox.minX
    }

    return sorted
        .compactMap { $0.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
        .joined(separator: "\n")
}

func recognizeText(in cgImage: CGImage) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["it-IT", "en-US"]
    request.minimumTextHeight = 0.015

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []
    return sortedRecognizedText(from: observations)
}

func cgImage(from imageURL: URL) throws -> CGImage {
    guard let image = NSImage(contentsOf: imageURL) else {
        throw OCRScriptError.cannotLoadImage
    }

    var proposedRect = NSRect(origin: .zero, size: image.size)
    guard let cgImage = image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
        throw OCRScriptError.cannotLoadImage
    }

    return cgImage
}

func renderPDFPage(_ page: PDFPage) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    let thumbnail = page.thumbnail(
        of: NSSize(width: max(bounds.width * 2.0, 800), height: max(bounds.height * 2.0, 1000)),
        for: .mediaBox
    )
    var proposedRect = NSRect(origin: .zero, size: thumbnail.size)
    return thumbnail.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil)
}

func recognizeText(inPDF pdfURL: URL) throws -> String {
    guard let document = PDFDocument(url: pdfURL) else {
        throw OCRScriptError.unsupportedFormat
    }

    let pageCount = min(document.pageCount, 12)
    var pageTexts: [String] = []

    for pageIndex in 0..<pageCount {
        guard let page = document.page(at: pageIndex), let cgImage = renderPDFPage(page) else {
            continue
        }

        let pageText = try recognizeText(in: cgImage)
        let normalized = pageText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !normalized.isEmpty {
            pageTexts.append(normalized)
        }
    }

    return pageTexts.joined(separator: "\n\n")
}

let arguments = CommandLine.arguments
guard arguments.count >= 2 else {
    fputs("Missing input path.\n", stderr)
    exit(1)
}

let inputURL = URL(fileURLWithPath: arguments[1])
let inputPath = inputURL.path.lowercased()

do {
    let output: String

    if inputPath.hasSuffix(".pdf") {
        output = try recognizeText(inPDF: inputURL)
    } else if [".png", ".jpg", ".jpeg", ".heic", ".heif", ".tif", ".tiff"].contains(where: { inputPath.hasSuffix($0) }) {
        output = try recognizeText(in: cgImage(from: inputURL))
    } else {
        throw OCRScriptError.unsupportedFormat
    }

    FileHandle.standardOutput.write(Data(output.utf8))
} catch {
    fputs("\(error)\n", stderr)
    exit(2)
}
