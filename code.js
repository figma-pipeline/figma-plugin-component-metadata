"use strict";
// Component Metadata Viewer Plugin
// This plugin displays comprehensive metadata about the actively selected components/nodes
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, {
    width: 800,
    height: 600,
    themeColors: true
});
function getNodeDepth(node) {
    let depth = 0;
    let current = node.parent;
    while (current && current.type !== 'DOCUMENT') {
        depth++;
        current = current.parent;
    }
    return depth;
}
function getHierarchicalPath(node) {
    const path = [node.name];
    let current = node.parent;
    while (current && current.type !== 'DOCUMENT') {
        path.unshift(current.name);
        current = current.parent;
    }
    return path.join(' > ');
}
function getCSSPath(node) {
    const path = [`${node.type}[name="${node.name}"]`];
    let current = node.parent;
    while (current && current.type !== 'DOCUMENT') {
        path.unshift(`${current.type}[name="${current.name}"]`);
        current = current.parent;
    }
    return path.join(' ');
}
function getParentDetails(node) {
    if (!node.parent || node.parent.type === 'DOCUMENT') {
        return undefined;
    }
    return {
        name: node.parent.name,
        type: node.parent.type,
        id: node.parent.id
    };
}
function getChildrenDetails(node) {
    if (!('children' in node)) {
        return [];
    }
    const childrenMap = new Map();
    node.children.forEach(child => {
        const key = `${child.type}:${child.name}`;
        if (childrenMap.has(key)) {
            childrenMap.get(key).count++;
        }
        else {
            childrenMap.set(key, { name: child.name, count: 1 });
        }
    });
    return Array.from(childrenMap.entries()).map(([key, value]) => ({
        name: value.name,
        type: key.split(':')[0],
        count: value.count
    }));
}
function getSiblingInfo(node) {
    var _a, _b;
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
    const previousSibling = position > 1 ? (_a = siblings[position - 2]) === null || _a === void 0 ? void 0 : _a.name : undefined;
    const nextSibling = position < totalSiblings ? (_b = siblings[position]) === null || _b === void 0 ? void 0 : _b.name : undefined;
    return {
        position,
        totalSiblings,
        previousSibling,
        nextSibling
    };
}
function getComponentRelationships(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const relationship = {
            isMainComponent: node.type === 'COMPONENT'
        };
        if (node.type === 'INSTANCE') {
            const mainComponent = yield node.getMainComponentAsync();
            if (mainComponent) {
                relationship.mainComponentPath = getHierarchicalPath(mainComponent);
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
    });
}
function extractTextProperties(node) {
    return {
        fontName: node.fontName,
        fontSize: node.fontSize,
        fontWeight: node.fontWeight,
        textCase: node.textCase === figma.mixed ? 'mixed' : node.textCase,
        textDecoration: node.textDecoration === figma.mixed ? 'mixed' : node.textDecoration,
        letterSpacing: node.letterSpacing === figma.mixed ? undefined : node.letterSpacing,
        lineHeight: node.lineHeight === figma.mixed ? undefined : node.lineHeight,
        characters: node.characters
    };
}
function extractLayoutProperties(node) {
    const layout = {};
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
function extractVisualProperties(node) {
    const visual = {
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
function extractComponentProperties(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const component = {
            isMainComponent: node.type === 'COMPONENT',
            isInstance: node.type === 'INSTANCE'
        };
        if (node.type === 'INSTANCE') {
            const mainComponent = yield node.getMainComponentAsync();
            component.mainComponentId = mainComponent === null || mainComponent === void 0 ? void 0 : mainComponent.id;
            component.variantProperties = node.variantProperties || undefined;
        }
        if (node.type === 'COMPONENT') {
            component.componentPropertyDefinitions = node.componentPropertyDefinitions;
            component.variantProperties = node.variantProperties || undefined;
        }
        return component;
    });
}
function extractMetadata(node) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const metadata = {
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
                parent: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.name,
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
            metadata.component = yield extractComponentProperties(node);
            metadata.hierarchy.componentRelationship = yield getComponentRelationships(node);
        }
        if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
            metadata.layout = extractLayoutProperties(node);
        }
        if (node.type === 'TEXT') {
            metadata.text = extractTextProperties(node);
        }
        return metadata;
    });
}
function sendMetadataUpdate() {
    return __awaiter(this, void 0, void 0, function* () {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.ui.postMessage({
                type: 'selection-updated',
                data: { hasSelection: false }
            });
            return;
        }
        const metadataArray = yield Promise.all(selection.map(node => extractMetadata(node)));
        figma.ui.postMessage({
            type: 'selection-updated',
            data: {
                hasSelection: true,
                count: selection.length,
                metadata: metadataArray
            }
        });
    });
}
function handleRenameComponents(changes) {
    return __awaiter(this, void 0, void 0, function* () {
        const results = [];
        for (const nodeId in changes) {
            const newName = changes[nodeId];
            try {
                const node = yield figma.getNodeByIdAsync(nodeId);
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
            }
            catch (error) {
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
        }
        else {
            figma.ui.postMessage({
                type: 'rename-error',
                error: `Failed to rename ${failures.length} component(s)`,
                details: failures
            });
        }
    });
}
figma.on('selectionchange', () => {
    sendMetadataUpdate().catch(error => {
        console.error('Error updating metadata:', error);
    });
});
figma.ui.onmessage = (msg) => {
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
