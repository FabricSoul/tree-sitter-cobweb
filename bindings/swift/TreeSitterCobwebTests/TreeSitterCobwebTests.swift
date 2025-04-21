import XCTest
import SwiftTreeSitter
import TreeSitterCobweb

final class TreeSitterCobwebTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_cobweb())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Cobweb grammar")
    }
}
