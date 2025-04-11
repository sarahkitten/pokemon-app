const A="data:image/png;base64,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";export{A as default};
