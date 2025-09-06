// Component Metadata Viewer Plugin
// This plugin displays comprehensive metadata about the actively selected components/nodes

interface ComponentMetadata {
  basic: {
    name: string;
    type: string;
    id: string;
    width: number;
    height: number;
    x: number;
    y: number;
  };
  component?: {
    isMainComponent: boolean;
    isInstance: boolean;
    mainComponentId?: string;
    variantProperties?: { [key: string]: string };
    componentPropertyDefinitions?: ComponentPropertyDefinitions;
  };
  visual: {
    fills?: ReadonlyArray<Paint>;
    strokes?: ReadonlyArray<Paint>;
    opacity: number;
    effects?: ReadonlyArray<Effect>;
    blendMode?: string;
  };
  layout?: {
    layoutMode?: string;
    layoutWrap?: string;
    itemSpacing?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    primaryAxisAlignItems?: string;
    counterAxisAlignItems?: string;
    layoutGrow?: number;
    layoutAlign?: string;
    constraints?: {
      horizontal: string;
      vertical: string;
    };
  };
  text?: {
    fontName?: { family: string; style: string };
    fontSize?: number;
    fontWeight?: number;
    textCase?: string;
    textDecoration?: string;
    letterSpacing?: LetterSpacing;
    lineHeight?: LineHeight;
    characters?: string;
  };
  hierarchy: {
    parent?: string;
    children: number;
    depth: number;
    hierarchicalPath: string;
    cssPath: string;
    parentDetails?: {
      name: string;
      type: string;
      id: string;
    };
    childrenDetails: Array<{
      name: string;
      type: string;
      count: number;
    }>;
    siblingInfo: {
      position: number;
      totalSiblings: number;
      previousSibling?: string;
      nextSibling?: string;
    };
    componentRelationship?: {
      isMainComponent: boolean;
      mainComponentPath?: string;
      instanceCount?: number;
      variantGroup?: string;
    };
  };
}

figma.showUI(__html__, { 
  width: 800, 
  height: 600,
  themeColors: true
});

function getNodeDepth(node: SceneNode): number {
  let depth = 0;
  let current: BaseNode | null = node.parent;
  while (current && current.type !== 'DOCUMENT') {
    depth++;
    current = current.parent;
  }
  return depth;
}

function getHierarchicalPath(node: SceneNode): string {
  const path: string[] = [node.name];
  let current: BaseNode | null = node.parent;
  
  while (current && current.type !== 'DOCUMENT') {
    path.unshift(current.name);
    current = current.parent;
  }
  
  return path.join(' > ');
}

function getCSSPath(node: SceneNode): string {
  const path: string[] = [`${node.type}[name="${node.name}"]`];
  let current: BaseNode | null = node.parent;
  
  while (current && current.type !== 'DOCUMENT') {
    path.unshift(`${current.type}[name="${current.name}"]`);
    current = current.parent;
  }
  
  return path.join(' ');
}

function getParentDetails(node: SceneNode): ComponentMetadata['hierarchy']['parentDetails'] {
  if (!node.parent || node.parent.type === 'DOCUMENT') {
    return undefined;
  }
  
  return {
    name: node.parent.name,
    type: node.parent.type,
    id: node.parent.id
  };
}

function getChildrenDetails(node: SceneNode): ComponentMetadata['hierarchy']['childrenDetails'] {
  if (!('children' in node)) {
    return [];
  }
  
  const childrenMap = new Map<string, { name: string; count: number }>();
  
  node.children.forEach(child => {
    const key = `${child.type}:${child.name}`;
    if (childrenMap.has(key)) {
      childrenMap.get(key)!.count++;
    } else {
      childrenMap.set(key, { name: child.name, count: 1 });
    }
  });
  
  return Array.from(childrenMap.entries()).map(([key, value]) => ({
    name: value.name,
    type: key.split(':')[0],
    count: value.count
  }));
}

function getSiblingInfo(node: SceneNode): ComponentMetadata['hierarchy']['siblingInfo'] {
  const parent = node.parent;
  if (!parent || parent.type === 'DOCUMENT' || !('children' in parent)) {
    return {
      position: 1,
      totalSiblings: 1
    };
  }
  
  const siblings = parent.children;
  const position = siblings.findIndex(child => child.id === node.id) + 1;
  const totalSiblings = siblings.length;
  
  const previousSibling = position > 1 ? siblings[position - 2]?.name : undefined;
  const nextSibling = position < totalSiblings ? siblings[position]?.name : undefined;
  
  return {
    position,
    totalSiblings,
    previousSibling,
    nextSibling
  };
}

async function getComponentRelationships(node: ComponentNode | InstanceNode): Promise<ComponentMetadata['hierarchy']['componentRelationship']> {
  const relationship: ComponentMetadata['hierarchy']['componentRelationship'] = {
    isMainComponent: node.type === 'COMPONENT'
  };
  
  if (node.type === 'INSTANCE') {
    const mainComponent = await node.getMainComponentAsync();
    if (mainComponent) {
      relationship.mainComponentPath = getHierarchicalPath(mainComponent as SceneNode);
    }
  }
  
  if (node.type === 'COMPONENT') {
    // Get variant group info if available
    if (node.variantProperties) {
      const variantKeys = Object.keys(node.variantProperties);
      relationship.variantGroup = variantKeys.length > 0 ? variantKeys.join(', ') : undefined;
    }
  }
  
  return relationship;
}

function extractTextProperties(node: TextNode): ComponentMetadata['text'] {
  return {
    fontName: node.fontName as { family: string; style: string },
    fontSize: node.fontSize as number,
    fontWeight: node.fontWeight as number,
    textCase: node.textCase === figma.mixed ? 'mixed' : node.textCase,
    textDecoration: node.textDecoration === figma.mixed ? 'mixed' : node.textDecoration,
    letterSpacing: node.letterSpacing === figma.mixed ? undefined : node.letterSpacing,
    lineHeight: node.lineHeight === figma.mixed ? undefined : node.lineHeight,
    characters: node.characters
  };
}

function extractLayoutProperties(node: FrameNode | ComponentNode | InstanceNode): ComponentMetadata['layout'] {
  const layout: ComponentMetadata['layout'] = {};
  
  if ('layoutMode' in node) {
    layout.layoutMode = node.layoutMode;
    layout.layoutWrap = node.layoutWrap;
    layout.itemSpacing = node.itemSpacing;
    layout.paddingTop = node.paddingTop;
    layout.paddingRight = node.paddingRight;
    layout.paddingBottom = node.paddingBottom;
    layout.paddingLeft = node.paddingLeft;
    layout.primaryAxisAlignItems = node.primaryAxisAlignItems;
    layout.counterAxisAlignItems = node.counterAxisAlignItems;
  }
  
  if ('layoutGrow' in node) {
    layout.layoutGrow = node.layoutGrow;
    layout.layoutAlign = node.layoutAlign;
  }
  
  if ('constraints' in node) {
    layout.constraints = {
      horizontal: node.constraints.horizontal,
      vertical: node.constraints.vertical
    };
  }
  
  return layout;
}

function extractVisualProperties(node: SceneNode): ComponentMetadata['visual'] {
  const visual: ComponentMetadata['visual'] = {
    opacity: 'opacity' in node ? node.opacity : 1
  };
  
  if ('fills' in node) {
    visual.fills = node.fills === figma.mixed ? undefined : node.fills;
  }
  
  if ('strokes' in node) {
    visual.strokes = node.strokes;
  }
  
  if ('effects' in node) {
    visual.effects = node.effects;
  }
  
  if ('blendMode' in node) {
    visual.blendMode = node.blendMode;
  }
  
  return visual;
}

async function extractComponentProperties(node: ComponentNode | InstanceNode): Promise<ComponentMetadata['component']> {
  const component: ComponentMetadata['component'] = {
    isMainComponent: node.type === 'COMPONENT',
    isInstance: node.type === 'INSTANCE'
  };
  
  if (node.type === 'INSTANCE') {
    const mainComponent = await node.getMainComponentAsync();
    component.mainComponentId = mainComponent?.id;
    component.variantProperties = node.variantProperties || undefined;
  }
  
  if (node.type === 'COMPONENT') {
    component.componentPropertyDefinitions = node.componentPropertyDefinitions;
    component.variantProperties = node.variantProperties || undefined;
  }
  
  return component;
}

async function extractMetadata(node: SceneNode): Promise<ComponentMetadata> {
  const metadata: ComponentMetadata = {
    basic: {
      name: node.name,
      type: node.type,
      id: node.id,
      width: 'width' in node ? node.width : 0,
      height: 'height' in node ? node.height : 0,
      x: 'x' in node ? node.x : 0,
      y: 'y' in node ? node.y : 0
    },
    visual: extractVisualProperties(node),
    hierarchy: {
      parent: node.parent?.name,
      children: 'children' in node ? node.children.length : 0,
      depth: getNodeDepth(node),
      hierarchicalPath: getHierarchicalPath(node),
      cssPath: getCSSPath(node),
      parentDetails: getParentDetails(node),
      childrenDetails: getChildrenDetails(node),
      siblingInfo: getSiblingInfo(node)
    }
  };
  
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    metadata.component = await extractComponentProperties(node as ComponentNode | InstanceNode);
    metadata.hierarchy.componentRelationship = await getComponentRelationships(node as ComponentNode | InstanceNode);
  }
  
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    metadata.layout = extractLayoutProperties(node as FrameNode | ComponentNode | InstanceNode);
  }
  
  if (node.type === 'TEXT') {
    metadata.text = extractTextProperties(node as TextNode);
  }
  
  return metadata;
}

async function sendMetadataUpdate() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({ 
      type: 'selection-updated', 
      data: { hasSelection: false } 
    });
    return;
  }
  
  const metadataArray = await Promise.all(selection.map(node => extractMetadata(node)));
  
  figma.ui.postMessage({ 
    type: 'selection-updated', 
    data: { 
      hasSelection: true, 
      count: selection.length,
      metadata: metadataArray 
    } 
  });
}

async function handleRenameComponents(changes: { [nodeId: string]: string }) {
  const results: { nodeId: string; success: boolean; error?: string }[] = [];
  
  for (const nodeId in changes) {
    const newName = changes[nodeId];
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        results.push({ nodeId, success: false, error: 'Node not found' });
        continue;
      }
      
      // Validate the name
      if (!newName || newName.trim() === '') {
        results.push({ nodeId, success: false, error: 'Name cannot be empty' });
        continue;
      }
      
      if (newName.length > 255) {
        results.push({ nodeId, success: false, error: 'Name too long' });
        continue;
      }
      
      // Apply the name change
      node.name = newName.trim();
      results.push({ nodeId, success: true });
      
    } catch (error) {
      results.push({ 
        nodeId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // Check if all renames were successful
  const failures = results.filter(r => !r.success);
  if (failures.length === 0) {
    figma.ui.postMessage({ type: 'rename-success' });
    // Refresh metadata to show new names
    sendMetadataUpdate();
  } else {
    figma.ui.postMessage({ 
      type: 'rename-error', 
      error: `Failed to rename ${failures.length} component(s)`,
      details: failures 
    });
  }
}

figma.on('selectionchange', () => {
  sendMetadataUpdate().catch(error => {
    console.error('Error updating metadata:', error);
  });
});

figma.ui.onmessage = (msg: { type: string; changes?: { [nodeId: string]: string } }) => {
  if (msg.type === 'get-initial-selection') {
    sendMetadataUpdate().catch(error => {
      console.error('Error getting initial selection:', error);
    });
  }
  
  if (msg.type === 'rename-components') {
    handleRenameComponents(msg.changes || {}).catch(error => {
      console.error('Error renaming components:', error);
      figma.ui.postMessage({
        type: 'rename-error',
        error: error.message
      });
    });
  }
  
  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

// Send initial selection data
sendMetadataUpdate().catch(error => {
  console.error('Error sending initial metadata:', error);
});