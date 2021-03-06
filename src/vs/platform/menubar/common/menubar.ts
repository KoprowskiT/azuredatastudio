/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { URI } from 'vs/base/common/uri';

export const IMenubarService = createDecorator<IMenubarService>('menubarService');

export interface IMenubarService {
	_serviceBrand: any;

	updateMenubar(windowId: number, menuData: IMenubarData): Promise<void>;
}

export interface IMenubarData {
	menus: { [id: string]: IMenubarMenu };
	keybindings: { [id: string]: IMenubarKeybinding };
}

export interface IMenubarMenu {
	items: Array<MenubarMenuItem>;
}

export interface IMenubarKeybinding {
	label: string;
	userSettingsLabel: string;
	isNative?: boolean; // Assumed true if missing
}

export interface IMenubarMenuItemAction {
	id: string;
	label: string;
	checked?: boolean; // Assumed false if missing
	enabled?: boolean; // Assumed true if missing
}

export interface IMenubarMenuUriItemAction {
	id: string;
	label: string;
	uri: URI;
	enabled?: boolean;
}

export interface IMenubarMenuItemSubmenu {
	id: string;
	label: string;
	submenu: IMenubarMenu;
}

export interface IMenubarMenuItemSeparator {
	id: 'vscode.menubar.separator';
}

export type MenubarMenuItem = IMenubarMenuItemAction | IMenubarMenuItemSubmenu | IMenubarMenuItemSeparator | IMenubarMenuUriItemAction;

export function isMenubarMenuItemSubmenu(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSubmenu {
	return (<IMenubarMenuItemSubmenu>menuItem).submenu !== undefined;
}

export function isMenubarMenuItemSeparator(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemSeparator {
	return (<IMenubarMenuItemSeparator>menuItem).id === 'vscode.menubar.separator';
}

export function isMenubarMenuItemUriAction(menuItem: MenubarMenuItem): menuItem is IMenubarMenuUriItemAction {
	return (<IMenubarMenuUriItemAction>menuItem).uri !== undefined;
}

export function isMenubarMenuItemAction(menuItem: MenubarMenuItem): menuItem is IMenubarMenuItemAction {
	return !isMenubarMenuItemSubmenu(menuItem) && !isMenubarMenuItemSeparator(menuItem) && !isMenubarMenuItemUriAction(menuItem);
}
