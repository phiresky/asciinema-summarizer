export function cleanTerminalOutput(outputLines: string[]): string {
  // Join all output
  const fullOutput = outputLines.join('');
  
  // Comprehensive escape sequence removal
  
  // Remove OSC (Operating System Command) sequences like window title setting
  // Pattern: ESC ] ... BEL or ESC ] ... ESC \
  // Examples: \u001b]0;title\u0007 or \u001b]0;title\u001b\\
  let cleanText = fullOutput.replace(/\x1B\][^\x07\x1B]*(\x07|\x1B\\)/g, '');
  
  // Remove ANSI escape sequences (colors, cursor movements, etc.)
  // This covers CSI sequences like \x1B[...m, \x1B[...H, etc.
  const ansiEscape = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
  cleanText = cleanText.replace(ansiEscape, '');
  
  // Remove DCS (Device Control String) sequences
  // Pattern: ESC P ... ESC \
  cleanText = cleanText.replace(/\x1BP[^\x1B]*\x1B\\/g, '');
  
  // Remove APC (Application Program Command) sequences  
  // Pattern: ESC _ ... ESC \
  cleanText = cleanText.replace(/\x1B_[^\x1B]*\x1B\\/g, '');
  
  // Remove PM (Privacy Message) sequences
  // Pattern: ESC ^ ... ESC \
  cleanText = cleanText.replace(/\x1B\^[^\x1B]*\x1B\\/g, '');
  
  // Remove other common escape sequences
  // Bell character (often used as terminator)
  cleanText = cleanText.replace(/\x07/g, '');
  
  // Backspace sequences
  cleanText = cleanText.replace(/\x08/g, '');
  
  // Form feed
  cleanText = cleanText.replace(/\x0c/g, '');
  
  // Vertical tab
  cleanText = cleanText.replace(/\x0b/g, '');
  
  // Remove cursor positioning and line status indicators
  // Pattern like "40,0-158%~@k" appears to be vim/editor status line
  cleanText = cleanText.replace(/\d+,\d*-?\d*%?~@[a-zA-Z]/g, '');
  cleanText = cleanText.replace(/\d+,\d+%~@[a-zA-Z]/g, '');
  
  // Remove other terminal control sequences
  // Clear screen sequences
  cleanText = cleanText.replace(/\x1B\[2J/g, '');
  cleanText = cleanText.replace(/\x1B\[H/g, '');
  
  // Remove carriage return followed by spaces (overwriting)
  cleanText = cleanText.replace(/\r +\r/g, '\n');
  
  // Normalize line endings
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');
  
  // Remove lines that are just control characters or status indicators
  const lines = cleanText.split('\n');
  const cleanedLines: string[] = [];
  
  for (const line of lines) {
    // Skip lines that are mostly/only control characters or status indicators
    const stripped = line.trim();
    
    // Skip empty lines
    if (!stripped) {
      cleanedLines.push('');
      continue;
    }
    
    // Skip lines that are just numbers, commas, percent signs and letters (status lines)
    if (/^[\d,%-~@a-zA-Z\s]*$/.test(stripped) && stripped.length < 20 && stripped.includes('%')) {
      continue;
    }
    
    // Skip lines with only control characters
    if (/^[\x00-\x1f\x7f-\x9f\s]*$/.test(stripped)) {
      continue;
    }
    
    cleanedLines.push(line);
  }
  
  // Rejoin and clean up excessive whitespace
  cleanText = cleanedLines.join('\n');
  
  // Remove excessive blank lines (more than 2 consecutive)
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
  
  // Remove trailing/leading whitespace from each line while preserving structure
  const finalLines = cleanText.split('\n');
  const trimmedLines = finalLines.map(line => line.trimEnd());
  cleanText = trimmedLines.join('\n');
  
  return cleanText.trim();
}