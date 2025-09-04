//Utility functions for handling text color changes in editor content
export const changeTextColorToBlack = (content) => {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Create a deep copy to avoid mutating the original
  const updatedContent = JSON.parse(JSON.stringify(content));

  // Recursive function to traverse and update text marks
  const updateTextMarks = (node) => {
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(child => {
        if (child.marks && Array.isArray(child.marks)) {
          // Remove all existing textStyle marks and add black color
          child.marks = child.marks.filter(mark => mark.type !== 'textStyle');
          
          // Add black text color mark
          child.marks.push({
            type: 'textStyle',
            attrs: {
              color: 'black !important',
              fontFamily: null,
              fontSize: null
            }
          });
        }
        // Recursively process child nodes
        updateTextMarks(child);
      });
    }
  };

  updateTextMarks(updatedContent);
  return updatedContent;
};

//Changes text color in editor content JSON from black to white
export const changeTextColorToWhite = (content) => {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Create a deep copy to avoid mutating the original
  const updatedContent = JSON.parse(JSON.stringify(content));

  // Recursive function to traverse and update text marks
  const updateTextMarks = (node) => {
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(child => {
        if (child.marks && Array.isArray(child.marks)) {
          child.marks.forEach(mark => {
            if (mark.type === 'textStyle' && mark.attrs && mark.attrs.color === 'black !important') {
              mark.attrs.color = 'white !important';
            }
          });
        }
        // Recursively process child nodes
        updateTextMarks(child);
      });
    }
  };

  updateTextMarks(updatedContent);
  return updatedContent;
};

//Removes all text color marks from editor content

export const removeTextColorMarks = (content) => {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Create a deep copy to avoid mutating the original
  const updatedContent = JSON.parse(JSON.stringify(content));

  // Recursive function to traverse and remove text color marks
  const removeTextMarks = (node) => {
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(child => {
        if (child.marks && Array.isArray(child.marks)) {
          // Filter out textStyle marks
          child.marks = child.marks.filter(mark => mark.type !== 'textStyle');
        }
        // Recursively process child nodes
        removeTextMarks(child);
      });
    }
  };

  removeTextMarks(updatedContent);
  return updatedContent;
};

//Forces all text to be black by removing existing color marks and adding black color
export const forceAllTextToBlack = (content) => {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Create a deep copy to avoid mutating the original
  const updatedContent = JSON.parse(JSON.stringify(content));

  // Recursive function to traverse and force black color
  const forceBlackColor = (node) => {
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(child => {
        if (child.marks && Array.isArray(child.marks)) {
          // Remove all existing textStyle marks
          child.marks = child.marks.filter(mark => mark.type !== 'textStyle');
          
          // Add black text color mark
          child.marks.push({
            type: 'textStyle',
            attrs: {
              color: 'black !important',
              fontFamily: null,
              fontSize: null
            }
          });
        }
        // Recursively process child nodes
        forceBlackColor(child);
      });
    }
  };

  forceBlackColor(updatedContent);
  return updatedContent;
}; 