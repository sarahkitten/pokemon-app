const A="data:image/png;base64,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";export{A as default};
