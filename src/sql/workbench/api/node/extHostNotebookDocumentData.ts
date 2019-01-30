/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as sqlops from 'sqlops';

import { IDisposable } from 'vs/base/common/lifecycle';
import { URI } from 'vs/base/common/uri';
import { ok } from 'vs/base/common/assert';
import { Schemas } from 'vs/base/common/network';
import { TPromise } from 'vs/base/common/winjs.base';

import { MainThreadNotebookDocumentsAndEditorsShape, INotebookModelChangedData } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { CellRange } from 'sql/workbench/api/common/sqlExtHostTypes';


export class ExtHostNotebookDocumentData implements IDisposable {
	private _document: sqlops.nb.NotebookDocument;
	private _isDisposed: boolean = false;

	constructor(private readonly _proxy: MainThreadNotebookDocumentsAndEditorsShape,
		private readonly _uri: URI,
		private _providerId: string,
		private _isDirty: boolean,
		private _cells: sqlops.nb.NotebookCell[]
	) {
	}

	dispose(): void {
		// we don't really dispose documents but let
		// extensions still read from them. some
		// operations, live saving, will now error tho
		ok(!this._isDisposed);
		this._isDisposed = true;
		this._isDirty = false;
	}


	get document(): sqlops.nb.NotebookDocument {
		if (!this._document) {
			const data = this;
			this._document = {
				get uri() { return data._uri; },
				get fileName() { return data._uri.fsPath; },
				get isUntitled() { return data._uri.scheme === Schemas.untitled; },
				get providerId() { return data._providerId; },
				get isClosed() { return data._isDisposed; },
				get isDirty() { return data._isDirty; },
				get cells() { return data._cells; },
				save() { return data._save(); },
				validateCellRange(range) { return data._validateRange(range); },
			};
		}
		return Object.freeze(this._document);
	}

	private _save(): Thenable<boolean> {
		if (this._isDisposed) {
			return TPromise.wrapError<boolean>(new Error('Document has been closed'));
		}
		return this._proxy.$trySaveDocument(this._uri);

	}

	public onModelChanged(data: INotebookModelChangedData) {
		if (data) {
			this._isDirty = data.isDirty;
			this._cells = data.cells;
			this._providerId = data.providerId;
		}
	}

	// ---- range math

	private _validateRange(range: sqlops.nb.CellRange): sqlops.nb.CellRange {
		if (!(range instanceof CellRange)) {
			throw new Error('Invalid argument');
		}

		let start = this._validateIndex(range.start);
		let end = this._validateIndex(range.end);

		if (start === range.start && end === range.end) {
			return range;
		}
		return new CellRange(start, end);
	}

	private _validateIndex(index: number): number {
		if (typeof(index) !== 'number') {
			throw new Error('Invalid argument');
		}

		if (index < 0) {
			index = 0;
		} else if (this._cells.length > 0 && index > this._cells.length) {
			// We allow off by 1 as end needs to be outside current length in order to
			// handle replace scenario. Long term should consider different start vs end validation instead
			index = this._cells.length;
		}

		return index;
	}

}
