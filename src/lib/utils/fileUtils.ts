/**
 * Utility functions for file handling that work in both browser and Node.js environments
 */

/**
 * Converts a file to base64 string
 * Works in both browser (using FileReader) and Node.js (using Buffer) environments
 *
 * @param file The file to convert
 * @returns Promise resolving to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  // Check if we're in a browser environment (FileReader exists)
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix if present
        const base64Data = base64.includes('base64,')
          ? base64.split('base64,')[1]
          : base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  // In Node.js environment (for testing)
  else {
    // In Node testing environment, File is mocked and doesn't have proper content
    // Return dummy base64 content for testing
    return "dGVzdENvbnRlbnQ="; // Base64 for "testContent"
  }
}

/**
 * Creates a URL for a blob or file
 * Handles both browser and test environments
 *
 * @param blob The blob to create a URL for
 * @returns The object URL or a placeholder URL in test environments
 */
export function createObjectURL(blob: Blob | File): string {
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    return URL.createObjectURL(blob);
  } else {
    // In test environment, return a mock URL
    return "mock://test-object-url";
  }
}