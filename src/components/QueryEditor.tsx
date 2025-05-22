import React from 'react';
import Editor from '@monaco-editor/react';

interface QueryEditorProps {
  query: string;
  setQuery: (query: string) => void;
  executeQuery: () => void;
  loading: boolean;
  theme?: string;
}

const QueryEditor: React.FC<QueryEditorProps> = ({
  query,
  setQuery,
  executeQuery,
  loading,
  theme = 'light'
}) => {
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Add SQL language features
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'SELECT',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'SELECT',
          },
          {
            label: 'FROM',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'FROM',
          },
          {
            label: 'WHERE',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'WHERE',
          },
          {
            label: 'GROUP BY',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'GROUP BY',
          },
          {
            label: 'ORDER BY',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'ORDER BY',
          },
          {
            label: 'HAVING',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'HAVING',
          },
          {
            label: 'JOIN',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'JOIN',
          },
          {
            label: 'LEFT JOIN',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'LEFT JOIN',
          },
          {
            label: 'RIGHT JOIN',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'RIGHT JOIN',
          },
          {
            label: 'INNER JOIN',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'INNER JOIN',
          },
        ];
        return { suggestions };
      },
    });

    // Add keyboard shortcut for executing query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeQuery();
    });
  };

  return (
    <div className="h-[400px] border rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={query}
        onChange={(value) => setQuery(value || '')}
        theme={theme === 'dark' ? 'light' : 'dark'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: loading,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          contextmenu: true,
          formatOnPaste: true,
          formatOnType: true,
          snippetSuggestions: 'inline',
          suggest: {
            preview: true,
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
          },
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default QueryEditor;