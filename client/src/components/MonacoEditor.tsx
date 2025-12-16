/**
 * Monaco Editor Component with Keystroke Capture Integration
 */

import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useKeystrokeCapture } from '../keystroke-capture/hooks/useKeystrokeCapture';
import type { CaptureConfig } from '../keystroke-capture/types';

export interface MonacoEditorProps {
  /**
   * Initial value of the editor
   */
  defaultValue?: string;

  /**
   * Programming language for syntax highlighting
   */
  language?: string;

  /**
   * Editor theme
   */
  theme?: 'vs-dark' | 'light' | 'hc-black' | 'hc-light';

  /**
   * Editor height
   */
  height?: string | number;

  /**
   * Editor width
   */
  width?: string | number;

  /**
   * Capture configuration
   */
  captureConfig: CaptureConfig;

  /**
   * Callback when editor is mounted
   */
  onMount?: (editor: any) => void;

  /**
   * Callback when editor value changes
   */
  onChange?: (value: string | undefined) => void;

  /**
   * Additional Monaco editor options
   */
  options?: object;
}

/**
 * Monaco Editor component with built-in keystroke capture
 *
 * @example
 * ```tsx
 * <MonacoEditor
 *   defaultValue="// Start coding..."
 *   language="javascript"
 *   theme="vs-dark"
 *   height="600px"
 *   captureConfig={{
 *     apiEndpoint: 'http://localhost:3000/api/keystroke',
 *     userId: 'user123',
 *     batchSizeLimit: 100,
 *     batchTimeLimit: 5000,
 *     enableConsent: true,
 *     debug: true
 *   }}
 * />
 * ```
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  defaultValue = '// Start coding...',
  language = 'javascript',
  theme = 'vs-dark',
  height = '600px',
  width = '100%',
  captureConfig,
  onMount,
  onChange,
  options = {}
}) => {
  const editorRef = useRef<any>(null);

  // Initialize keystroke capture
  const { handleEditorMount } = useKeystrokeCapture(captureConfig);

  /**
   * Handle editor mount
   */
  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Initialize capture
    handleEditorMount(editor);

    // Call user's onMount callback if provided
    if (onMount) {
      onMount(editor);
    }
  };

  /**
   * Default editor options
   */
  const defaultOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    ...options
  };

  return (
    <Editor
      height={height}
      width={width}
      defaultLanguage={language}
      defaultValue={defaultValue}
      theme={theme}
      onMount={handleMount}
      onChange={onChange}
      options={defaultOptions}
    />
  );
};

export default MonacoEditor;
