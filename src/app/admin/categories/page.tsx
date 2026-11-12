'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FolderPlus,
  Image as ImageIcon,

  Move,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api-client';
import { slugifyCategory, type SearchCategoryNode } from '@/lib/category-tree';

type CategoryTree = SearchCategoryNode[];
type CategoryLabels = SearchCategoryNode['labels'];

function updateNode(tree: CategoryTree, id: string, update: (node: SearchCategoryNode) => SearchCategoryNode): CategoryTree {
  return tree.map((node) =>
    node.id === id
      ? update(node)
      : { ...node, ...(node.children ? { children: updateNode(node.children, id, update) } : {}) }
  );
}

function addNode(tree: CategoryTree, parentId: string | null, node: SearchCategoryNode): CategoryTree {
  if (parentId === null) return [...tree, node];
  return tree.map((item) => {
    if (item.id === parentId) return { ...item, children: [...(item.children ?? []), node] };
    return item.children
      ? { ...item, children: addNode(item.children, parentId, node) }
      : item;
  });
}

function removeNode(tree: CategoryTree, id: string): CategoryTree {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => node.children ? { ...node, children: removeNode(node.children, id) } : node);
}

function flattenTree(tree: CategoryTree, depth = 0): { id: string; label: string; depth: number }[] {
  return tree.flatMap((node) => [
    { id: node.id, label: node.labels.fr, depth },
    ...flattenTree(node.children ?? [], depth + 1),
  ]);
}

function collectDescendantIds(node: SearchCategoryNode): Set<string> {
  return new Set([node.id, ...(node.children ?? []).flatMap((child) => [...collectDescendantIds(child)])]);
}

function collectBranchIds(tree: CategoryTree): Set<string> {
  return new Set(tree.flatMap((node) => [
    ...(node.children?.length ? [node.id] : []),
    ...collectBranchIds(node.children ?? []),
  ]));
}

function findNode(tree: CategoryTree, id: string): SearchCategoryNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node;
    const child = findNode(node.children ?? [], id);
    if (child) return child;
  }
  return undefined;
}

function findParentId(tree: CategoryTree, id: string): string | null {
  for (const node of tree) {
    if (node.children?.some((child) => child.id === id)) return node.id;
    const parentId = findParentId(node.children ?? [], id);
    if (parentId !== null) return parentId;
  }
  return null;
}

function findDuplicateCategory(
  tree: CategoryTree,
  label: string,
  excludeId: string
): { name: string; path: string[] } | null {
  const normalize = (value: string) =>
    value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const target = normalize(label);

  function visit(nodes: CategoryTree, ancestors: string[]): { name: string; path: string[] } | null {
    for (const node of nodes) {
      const path = [...ancestors, node.labels.fr];
      if (node.id !== excludeId && normalize(node.labels.fr) === target) {
        return { name: node.labels.fr, path };
      }
      const duplicate = visit(node.children ?? [], path);
      if (duplicate) return duplicate;
    }
    return null;
  }

  return visit(tree, []);
}

function alertDuplicateCategory(duplicate: { name: string; path: string[] }): void {
  window.alert(
    `This category already exists.\nCategory: ${duplicate.name}\nRoute: ${duplicate.path.join(' > ')}`
  );
}

function reorderNode(tree: CategoryTree, id: string, direction: -1 | 1): CategoryTree {
  const index = tree.findIndex((node) => node.id === id);
  if (index >= 0) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= tree.length) return tree;
    const reordered = [...tree];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    return reordered;
  }
  return tree.map((node) => node.children
    ? { ...node, children: reorderNode(node.children, id, direction) }
    : node);
}

function reparentNode(tree: CategoryTree, id: string, parentId: string | null): CategoryTree {
  const node = findNode(tree, id);
  if (!node) return tree;
  const withoutNode = removeNode(tree, id);
  return addNode(withoutNode, parentId, node);
}

function newCategoryId(): string {
  return `category-${crypto.randomUUID()}`;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree>([]);
  const [savedCategories, setSavedCategories] = useState<CategoryTree>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabels, setEditLabels] = useState<CategoryLabels>({ fr: '', en: '', ar: '' });
  const [editImage, setEditImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [parentSelection, setParentSelection] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const flattened = useMemo(() => flattenTree(categories), [categories]);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ categories: CategoryTree }>('/admin/categories');
      setCategories(response.categories);
      setSavedCategories(response.categories);
      setCollapsedIds(collectBranchIds(response.categories));
      setDirty(false);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, 'Categories could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  function changeTree(next: CategoryTree) {
    setCategories(next);
    setDirty(true);
  }

  function startEditing(node: SearchCategoryNode) {
    setEditingId(node.id);
    setEditLabels({ fr: node.labels.fr ?? '', en: node.labels.en ?? '', ar: node.labels.ar ?? '' });
    setEditImage(node.image ?? '');
    setUploadedUrl(null);
  }

  async function uploadImage(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(res.status === 401
          ? 'Your session has expired. Reload this page and sign in as an administrator, then try the upload again.'
          : body.error || 'Image upload failed.');
      }
      const data = await res.json();
      setUploadedUrl(data.url);
      setEditImage(data.url);
      setDirty(true);
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError, 'Image upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  }

  function addCategory(parentId: string | null) {
    const id = newCategoryId();
    const node: SearchCategoryNode = {
      id,
      slug: 'new-category',
      labels: { fr: 'Nouvelle catégorie', en: 'New category', ar: 'فئة جديدة' },
    };
    changeTree(addNode(categories, parentId, node));
    if (parentId) {
      setCollapsedIds((collapsed) => {
        const next = new Set(collapsed);
        next.delete(parentId);
        return next;
      });
    }
    startEditing(node);
  }

  function deleteCategory(node: SearchCategoryNode) {
    const subtreeIds = collectDescendantIds(node);
    const descendantCount = subtreeIds.size - 1;
    const detail = descendantCount
      ? `This also deletes its ${descendantCount} nested ${descendantCount === 1 ? 'category' : 'categories'}.`
      : 'This cannot be undone after saving.';
    if (!window.confirm(`Delete "${node.labels.fr}"? ${detail}`)) return;
    changeTree(removeNode(categories, node.id));
    if (editingId && subtreeIds.has(editingId)) setEditingId(null);
    if (movingId && subtreeIds.has(movingId)) setMovingId(null);
    setCollapsedIds((collapsed) => new Set([...collapsed].filter((id) => !subtreeIds.has(id))));
  }

  function saveNodeLabels() {
    if (!editingId || !editLabels.fr.trim()) return;
    const french = editLabels.fr.trim();
    const nextTree = updateNode(categories, editingId, (node) => ({
      ...node,
      slug: slugifyCategory(french),
      labels: {
        fr: french,
        en: editLabels.en.trim() || french,
        ar: editLabels.ar.trim() || french,
      },
      image: editImage.trim() || undefined,
    }));
    const duplicate = findDuplicateCategory(nextTree, french, editingId);
    if (duplicate) {
      alertDuplicateCategory(duplicate);
      return;
    }
    changeTree(nextTree);
    setEditingId(null);
  }

  function moveCategory(id: string) {
    const currentParentId = findParentId(categories, id);
    const nextParentId = parentSelection || null;
    if (currentParentId !== nextParentId) changeTree(reparentNode(categories, id, nextParentId));
    setMovingId(null);
  }

  async function saveTree() {
    if (editingId && !editLabels.fr.trim()) {
      setError('A category must have a French label.');
      return;
    }
    const treeToSave = editingId
      ? updateNode(categories, editingId, (node) => {
          const french = editLabels.fr.trim();
          return {
            ...node,
            slug: slugifyCategory(french),
            labels: {
              fr: french,
              en: editLabels.en.trim() || french,
              ar: editLabels.ar.trim() || french,
            },
            image: editImage.trim() || undefined,
          };
        })
      : categories;
    if (editingId) {
      const duplicate = findDuplicateCategory(
        treeToSave,
        editLabels.fr.trim(),
        editingId
      );
      if (duplicate) {
        alertDuplicateCategory(duplicate);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const response = await api.put<{ categories: CategoryTree }>('/admin/categories', { categories: treeToSave });
      try { localStorage.setItem('medina.categories.updated', String(Date.now())); } catch { /* Cross-tab refresh is optional. */ }
      setCategories(response.categories);
      setSavedCategories(response.categories);
      setDirty(false);
      setEditingId(null);
    } catch (saveError) {
      setError(apiErrorMessage(saveError, 'Categories could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  function discardChanges() {
    setCategories(savedCategories);
    setDirty(false);
    setEditingId(null);
    setMovingId(null);
    setError(null);
  }

  function renderNode(node: SearchCategoryNode, index: number, siblingCount: number): React.ReactNode {
    const hasChildren = !!node.children?.length;
    const collapsed = collapsedIds.has(node.id);
    const descendants = collectDescendantIds(node);
    const currentParentId = findParentId(categories, node.id);
    const availableParents = flattened.filter((item) => !descendants.has(item.id));
    const displayLabel = node.labels.en && node.labels.en !== node.labels.fr
      ? `${node.labels.fr} · ${node.labels.en}`
      : node.labels.fr;

    return (
      <li key={node.id} className="min-w-0">
        <div className="rounded-xl border border-ink-900/10 bg-white">
          <div className="flex flex-wrap items-center gap-2 p-3">
            {hasChildren && (
              <button
                type="button"
                onClick={() => setCollapsedIds((collapsedCategories) => {
                  const next = new Set(collapsedCategories);
                  if (next.has(node.id)) next.delete(node.id);
                  else next.add(node.id);
                  return next;
                })}
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${node.labels.fr}`}
                title={`${collapsed ? 'Expand' : 'Collapse'} category`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-500 hover:bg-sand-100"
              >
                <ChevronDown size={14} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
              </button>
            )}
            {node.image ? (
              <Image
                src={node.image}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-lg border border-ink-900/10 object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-400">
                <ImageIcon size={15} />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{displayLabel}</span>
            {hasChildren && (
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs font-medium text-ink-500">
                {node.children!.length} {node.children!.length === 1 ? 'child' : 'children'}
              </span>
            )}
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => startEditing(node)} title="Edit labels" aria-label={`Edit ${node.labels.fr}`} className="rounded-lg p-2 text-ink-600 hover:bg-sand-100">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => addCategory(node.id)} title="Add child category" aria-label={`Add a child to ${node.labels.fr}`} className="rounded-lg p-2 text-ink-600 hover:bg-sand-100">
                <Plus size={16} />
              </button>
              <button type="button" disabled={index === 0} onClick={() => changeTree(reorderNode(categories, node.id, -1))} title="Move up" aria-label={`Move ${node.labels.fr} up`} className="rounded-lg p-2 text-ink-600 hover:bg-sand-100 disabled:opacity-30">
                <ArrowUp size={15} />
              </button>
              <button type="button" disabled={index === siblingCount - 1} onClick={() => changeTree(reorderNode(categories, node.id, 1))} title="Move down" aria-label={`Move ${node.labels.fr} down`} className="rounded-lg p-2 text-ink-600 hover:bg-sand-100 disabled:opacity-30">
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovingId(movingId === node.id ? null : node.id);
                  setParentSelection(currentParentId ?? '');
                }}
                title="Move to another parent"
                aria-label={`Move ${node.labels.fr} to another parent`}
                className="rounded-lg p-2 text-ink-600 hover:bg-sand-100"
              >
                <Move size={15} />
              </button>
              <button type="button" onClick={() => deleteCategory(node)} title="Delete category and descendants" aria-label={`Delete ${node.labels.fr}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {editingId === node.id && (
            <div className="grid gap-3 border-t border-ink-900/10 p-3 sm:grid-cols-3">
              {(['fr', 'en', 'ar'] as const).map((locale) => (
                <label key={locale} className="text-xs font-semibold uppercase text-ink-500">
                  {locale === 'fr' ? 'French' : locale === 'en' ? 'English' : 'Arabic'}
                  <input
                    value={editLabels[locale] ?? ''}
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                    onChange={(event) => {
                      setEditLabels((labels) => ({ ...labels, [locale]: event.target.value }));
                      setDirty(true);
                    }}
                    className="mt-1 w-full rounded-lg border border-ink-900/15 px-3 py-2 text-sm font-normal text-ink-900"
                    maxLength={200}
                    autoFocus={locale === 'fr'}
                  />
                </label>
              ))}
              <label className="text-xs font-semibold uppercase text-ink-500 sm:col-span-3">
                Card photo
                <span className="ms-2 font-normal normal-case text-ink-400">
                  Upload from your device or enter a URL.
                </span>
                <div className="mt-1 flex flex-col items-center gap-2">
                  {/* Drag-and-drop upload zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const files = e.dataTransfer.files;
                      if (files.length) uploadImage(files[0]);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 transition-colors ${
                      dragOver
                        ? 'border-terracotta-600 bg-terracotta-50/20'
                        : 'border-ink-900/15 bg-sand-100/30 hover:border-terracotta-600 hover:bg-terracotta-50/10'
                    }`}
                  >
                    <Upload size={20} className={`text-ink-600 ${dragOver ? 'text-terracotta-600 animate-pulse' : ''}`} />
                    <span className="text-xs text-ink-600 font-medium">
                      {dragOver ? 'Drop image here…' : 'Drag & drop or click to upload'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files?.length) uploadImage(files[0]);
                      }}
                    />
                  </div>

                  {/* Preview + max size hint */}
                  {editImage.trim() || uploadedUrl ? (
                    <div className="flex items-center justify-center gap-2">
                      <Image
                        src={editImage.trim() || uploadedUrl!}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-lg border border-ink-900/10 object-cover"
                      />
                      {uploading ? (
                        <span className="text-[10px] text-terracotta-600 font-medium">Uploading…</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditImage('');
                            setUploadedUrl(null);
                            setDirty(true);
                          }}
                          className="text-[10px] text-ink-500 hover:text-ink-900 underline"
                        >
                          Keep empty
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-ink-400">No image selected</span>
                  )}

                  {/* Manual URL input */}
                  <input
                    value={editImage}
                    onChange={(event) => {
                      setEditImage(event.target.value);
                      setUploadedUrl(null);
                      setDirty(true);
                    }}
                    placeholder="/images/categories/technique.jpg"
                    className="w-full rounded-lg border border-ink-900/15 px-3 py-2 text-xs font-normal text-ink-900"
                    maxLength={2048}
                  />
                </div>
              </label>
              <div className="flex items-end gap-2 sm:col-span-3">
                <button type="button" onClick={saveNodeLabels} disabled={!editLabels.fr.trim()} className="rounded-lg bg-majorelle-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  Apply labels
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-sand-100">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {movingId === node.id && (
            <div className="flex flex-wrap items-center gap-2 border-t border-ink-900/10 p-3">
              <label className="text-xs font-semibold text-ink-600" htmlFor={`parent-${node.id}`}>New parent</label>
              <select
                id={`parent-${node.id}`}
                value={parentSelection}
                onChange={(event) => setParentSelection(event.target.value)}
                className="min-w-48 rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm"
              >
                <option value="">Top level</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>{'　'.repeat(parent.depth)}{parent.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => moveCategory(node.id)} className="rounded-lg bg-majorelle-600 px-3 py-2 text-xs font-semibold text-white">Move</button>
              <button type="button" onClick={() => setMovingId(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-sand-100">Cancel</button>
            </div>
          )}
        </div>

        {hasChildren && !collapsed && (
          <ul className="ms-4 mt-2 space-y-2 border-s border-ink-900/10 ps-3">
            {node.children!.map((child, childIndex) => renderNode(child, childIndex, node.children!.length))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Category management</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage the public category tree, its translations, hierarchy, and display order.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => addCategory(null)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-100 disabled:opacity-50">
            <FolderPlus size={16} /> Add top-level
          </button>
          <button type="button" onClick={saveTree} disabled={loading || saving || !dirty} className="inline-flex items-center gap-2 rounded-xl bg-majorelle-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-majorelle-700 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm shadow-card">
        <p className="text-ink-600">{flattened.length} categories · {categories.length} top-level</p>
        <div className="flex items-center gap-3">
          {dirty && <span className="font-medium text-amber-700">Unsaved changes</span>}
          {dirty && (
            <button type="button" onClick={discardChanges} disabled={saving} className="inline-flex items-center gap-1.5 text-ink-600 hover:text-ink-900 disabled:opacity-50">
              <RotateCcw size={14} /> Discard
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink-500">Loading categories…</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {categories.map((node, index) => renderNode(node, index, categories.length))}
        </ul>
      )}

      {!loading && (
        <p className="mt-5 text-xs leading-5 text-ink-500">
          Deleting a parent removes its full subtree, but does not delete listings. Renaming a unique leaf also updates providers assigned to that category.
        </p>
      )}
    </div>
  );
}
