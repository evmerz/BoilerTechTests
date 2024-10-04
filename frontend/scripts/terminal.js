// Load Pyodide
let pyodide;
async function loadPyodideAndPackages() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
    });
    document.getElementById('run').disabled = false; // Enable the button when ready
}
loadPyodideAndPackages();

// Disable the run button initially
document.getElementById('run').disabled = true;

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
    lineNumbers: true,
    mode: "python",
    theme: "eclipse" // Use the lighter theme
});

// Run code function
document.getElementById('run').addEventListener('click', async () => {
    const code = editor.getValue().trim(); // Get the value from CodeMirror and trim whitespace
    try {
        // Capture print output
        let output = await pyodide.runPython(`
            import sys
            from io import StringIO
            
            # Redirect standard output
            old_stdout = sys.stdout
            sys.stdout = StringIO()

            # Prepare the user code
            user_code = '''${code.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'''
            
            # Run the user code
            exec(user_code)
            
            # Get the output
            output = sys.stdout.getvalue()
            sys.stdout = old_stdout  # Restore standard output
            output
        `);
        document.getElementById('output').textContent = output || ""; // Ensure output is set
    } catch (error) {
        document.getElementById('output').textContent = error;
    }
});