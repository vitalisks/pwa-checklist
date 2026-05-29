export interface Translations {
  nav: {
    home: string
    active: string
    templates: string
    settings: string
  }
  home: {
    templatesFound: string
    activeChecklists: string
    noMatches: string
    noTemplates: string
    noChecklists: string
    addTemplate: string
  }
  templates: {
    title: string
    new: string
    items: string
    categories: string
    use: string
    noDesc: string
  }
  editor: {
    new: string
    edit: string
    cancel: string
    save: string
    titlePlaceholder: string
    titlePlaceholderRequired: string
    descPlaceholder: string
    catsItemsLabel: string
    addCat: string
    catPlaceholder: string
    itemPlaceholder: string
    addItem: string
    itemDesc: string
    itemDescPlaceholder: string
  }
  checklist: {
    complete: string
    doneMsg: string
    back: string
    skip: string
    itemSkipped: string
    editTitle: string
    titlePlaceholder: string
    fromTemplate: string
    editMode: string
    saveMode: string
  }
  common: {
    save: string
    cancel: string
    actionCancel: string
    ok: string
    done: string
    findPlaceholder: string
    seeMore: string
    seeLess: string
    delete: {
      confirm: string
      confirmTitle: string
      confirmMsg: string
      confirmAction: string
    }
  }
  settings: {
    title: string
    desc: string
    language: string
    clearData: string
    clearWarning: string
    data: string
    export: string
    import: string
    importError: string
  }
  item: {
    addPhoto: string
    deletePhoto: string
    guidePhoto: string
    guidePhotoBadge: string
    yourPhoto: string
    photos: string
    noPhotos: string
  }
  validation: {
    requiredTitle: string
    titleRequired: string
    categoryNameRequired: string
    itemNameRequired: string
  }
  filter: {
    all: string
    unfinished: string
    done: string
  }
  idea: {
    button: string
    viewTitle: string
    placeholder: string
    createTemplate: string
    copyInstruction: string
    copySuccess: string
    pasteButton: string
    pasteSuccess: string
    previewTitle: string
    previewEdit: string
    previewSave: string
    errorEmpty: string
    errorClipboardUnavailable: string
    errorInvalidJson: string
    errorInvalidSchema: string
    copyError: string
    back: string
    listening: string
    voiceStart: string
  }
}

const localeModules = import.meta.glob<{ default: Translations }>('./locales/*.ts')

export const languageLoaders: Record<string, () => Promise<Translations>> = Object.fromEntries(
  Object.entries(localeModules).map(([path, load]) => [
    path.match(/\/(\w+)\.ts$/)?.[1] ?? '',
    () => load().then(m => m.default),
  ])
)

export const AVAILABLE_LANGUAGES = Object.keys(languageLoaders)
export const DEFAULT_LANGUAGE = 'en'
