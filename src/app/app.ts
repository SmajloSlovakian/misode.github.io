import Split from 'split.js'
import {
  DataModel,
  IView,
  TreeView,
  SourceView,
  ConditionSchema,
  LootTableSchema,
  AdvancementSchema,
  DimensionSchema,
  DimensionTypeSchema,
  LOCALES,
  locale,
  COLLECTIONS
} from 'minecraft-schemas'
import { RegistryFetcher } from './RegistryFetcher'
import { SandboxSchema } from './Sandbox'
import { ErrorsView } from './ErrorsView'

const LOCAL_STORAGE_THEME = 'theme'

const modelFromPath = (p: string) => p.split('/').filter(e => e.length !== 0).pop() ?? ''

const addChecked = (el: HTMLElement) => {
  el.classList.add('check')
  setTimeout(() => {
    el.classList.remove('check')
  }, 2000)
}

const languages: { [key: string]: string } = {
  'en': 'English',
  'pt': 'Português',
  'ru': 'Русский',
  'zh-CN': '简体中文'
}

const registries = [
  'attribute',
  'biome',
  'biome_source',
  'block',
  'enchantment',
  'entity_type',
  'fluid',
  'item',
  'loot_condition_type',
  'loot_function_type',
  'loot_pool_entry_type',
  'mob_effect',
  'stat_type',
  'structure_feature'
]

const treeViewObserver = (el: HTMLElement) => {
  el.querySelectorAll('.node-header[data-error]').forEach(e => {
    e.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path></svg>`)
  })
  el.querySelectorAll('.collapse.closed, button.add').forEach(e => {
    e.insertAdjacentHTML('afterbegin', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"></path></svg>`)
  })
  el.querySelectorAll('.collapse.open, button.remove').forEach(e => {
    e.insertAdjacentHTML('afterbegin', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"></path></svg>
    `)
  })
}

const publicPath = process.env.NODE_ENV === 'production' ? '/dev/' : '/';
Promise.all([
  fetch(publicPath + 'locales/schema/en.json').then(r => r.json()),
  fetch(publicPath + 'locales/app/en.json').then(r => r.json()),
  RegistryFetcher(COLLECTIONS, registries)
]).then(responses => {
  LOCALES.register('en', {...responses[0], ...responses[1]})

  const selectedModel = document.getElementById('selected-model')!
  const modelSelector = document.getElementById('model-selector')!
  const modelSelectorMenu = document.getElementById('model-selector-menu')!
  const languageSelector = document.getElementById('language-selector')!
  const languageSelectorMenu = document.getElementById('language-selector-menu')!
  const themeSelector = document.getElementById('theme-selector')!
  const treeViewEl = document.getElementById('tree-view')!
  const sourceViewEl = document.getElementById('source-view')!
  const errorsViewEl = document.getElementById('errors-view')!
  const errorsToggle = document.getElementById('errors-toggle')!
  const sourceViewOutput = (document.getElementById('source-view-output') as HTMLTextAreaElement)
  const treeViewOutput = document.getElementById('tree-view-output')!
  const sourceControlsToggle = document.getElementById('source-controls-toggle')!
  const sourceControlsMenu = document.getElementById('source-controls-menu')!
  const sourceControlsCopy = document.getElementById('source-controls-copy')!
  const sourceControlsDownload = document.getElementById('source-controls-download')!
  const sourceToggle = document.getElementById('source-toggle')!
  const treeControlsToggle = document.getElementById('tree-controls-toggle')!
  const treeControlsMenu = document.getElementById('tree-controls-menu')!
  const treeControlsVersionToggle = document.getElementById('tree-controls-version-toggle')!
  const treeControlsVersionMenu = document.getElementById('tree-controls-version-menu')!
  const treeControlsReset = document.getElementById('tree-controls-reset')!
  const treeControlsUndo = document.getElementById('tree-controls-undo')!
  const treeControlsRedo = document.getElementById('tree-controls-redo')!

  let selected = modelFromPath(location.pathname)
  if (selected.length === 0) {
    selected = 'loot-table'
  }

  const models: { [key: string]: DataModel } = {
    'loot-table': new DataModel(LootTableSchema),
    'predicate': new DataModel(ConditionSchema),
    'advancement': new DataModel(AdvancementSchema),
    'dimension': new DataModel(DimensionSchema),
    'dimension-type': new DataModel(DimensionTypeSchema),
    'sandbox': new DataModel(SandboxSchema)
  }

  const views: IView[] = [
    new TreeView(models[selected], treeViewOutput, {
      showErrors: true,
      observer: treeViewObserver
    }),
    new SourceView(models[selected], sourceViewOutput, {
      indentation: 2
    }),
    new ErrorsView(models[selected], errorsViewEl)
  ]

  const updateModel = (newModel: string) => {
    selected = newModel
    views.forEach(v => v.setModel(models[selected]))
    selectedModel.textContent = locale(`title.${selected}`)
  
    modelSelectorMenu.innerHTML = ''
    Object.keys(models).forEach(m => {
      modelSelectorMenu.insertAdjacentHTML('beforeend', 
        `<div class="btn${m === selected ? ' selected' : ''}">${locale(m)}</div>`)
      modelSelectorMenu.lastChild?.addEventListener('click', evt => {
        updateModel(m)
        history.pushState({model: m}, m, publicPath + m)
        modelSelectorMenu.style.visibility = 'hidden'
      })
    })

    models[selected].invalidate()
  }

  const updateLanguage = (key: string) => {
    LOCALES.language = key
  
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = locale(el.attributes.getNamedItem('data-i18n')!.value)
    })

    languageSelectorMenu.innerHTML = ''
    Object.keys(languages).forEach(key => {
      languageSelectorMenu.insertAdjacentHTML('beforeend',
        `<div class="btn${key === LOCALES.language ? ' selected' : ''}">${languages[key]}</div>`)
      languageSelectorMenu.lastChild?.addEventListener('click', evt => {
        updateLanguage(key)
        languageSelectorMenu.style.visibility = 'hidden'
      })
    })

    updateModel(selected)
  }
  updateLanguage('en')

  Split([treeViewEl, sourceViewEl], {
    sizes: [66, 34]
  })

  modelSelector.addEventListener('click', evt => {
    modelSelectorMenu.style.visibility = 'visible'
    document.body.addEventListener('click', evt => {
      modelSelectorMenu.style.visibility = 'hidden'
    }, { capture: true, once: true })
  })

  window.onpopstate = (evt: PopStateEvent) => {
    updateModel(modelFromPath(location.pathname))
  }

  sourceToggle.addEventListener('click', evt => {
    if (sourceViewEl.classList.contains('active')) {
      sourceViewEl.classList.remove('active')
      sourceToggle.classList.remove('toggled')
    } else {
      sourceViewEl.classList.add('active')
      sourceToggle.classList.add('toggled')
    }
  })

  languageSelector.addEventListener('click', evt => {
    languageSelectorMenu.style.visibility = 'visible'
    document.body.addEventListener('click', evt => {
      languageSelectorMenu.style.visibility = 'hidden'
    }, { capture: true, once: true })
  })

  const updateTheme = (theme: string | null) => {
    if (theme === null) return
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      themeSelector.classList.add('toggled')
      localStorage.setItem(LOCAL_STORAGE_THEME, 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      themeSelector.classList.remove('toggled')
      localStorage.setItem(LOCAL_STORAGE_THEME, 'light')
    }
  }
  updateTheme(localStorage.getItem(LOCAL_STORAGE_THEME))

  themeSelector.addEventListener('click', evt => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      updateTheme('light')
    } else {
      updateTheme('dark')
    }
  })

  sourceControlsToggle.addEventListener('click', evt => {
    sourceControlsMenu.style.visibility = 'visible'
    document.body.addEventListener('click', evt => {
      sourceControlsMenu.style.visibility = 'hidden'
    }, { capture: true, once: true })
  })

  sourceControlsCopy.addEventListener('click', evt => {
    sourceViewOutput.select()
    document.execCommand('copy');
    addChecked(sourceControlsCopy)
  })

  sourceControlsDownload.addEventListener('click', evt => {
    const fileContents = encodeURIComponent(JSON.stringify(models[selected].data, null, 2) + "\n")
    const dataString = "data:text/json;charset=utf-8," + fileContents
    const downloadAnchor = document.getElementById('source-controls-download-anchor')!
    downloadAnchor.setAttribute("href", dataString)
    downloadAnchor.setAttribute("download", "data.json")
    downloadAnchor.click()
  })

  treeControlsToggle.addEventListener('click', evt => {
    treeControlsMenu.style.visibility = 'visible'
    document.body.addEventListener('click', evt => {
      treeControlsMenu.style.visibility = 'hidden'
    }, { capture: true, once: true })
  })

  treeControlsVersionToggle.addEventListener('click', evt => {
    treeControlsVersionMenu.style.visibility = 'visible'
    document.body.addEventListener('click', evt => {
      treeControlsVersionMenu.style.visibility = 'hidden'
    }, { capture: true, once: true })
  })

  treeControlsReset.addEventListener('click', evt => {
    models[selected].reset(models[selected].schema.default())
    addChecked(treeControlsReset)
  })

  treeControlsUndo.addEventListener('click', evt => {
    models[selected].undo()
  })

  treeControlsRedo.addEventListener('click', evt => {
    models[selected].redo()
  })

  document.addEventListener('keyup', evt => {
    if (evt.ctrlKey && evt.key === 'z') {
      models[selected].undo()
    } else if (evt.ctrlKey && evt.key === 'y') {
      models[selected].redo()
    }
  })

  errorsToggle.addEventListener('click', evt => {
    if (errorsViewEl.classList.contains('hidden')) {
      errorsViewEl.classList.remove('hidden')
      errorsToggle.classList.remove('toggled')
    } else {
      errorsViewEl.classList.add('hidden')
      errorsToggle.classList.add('toggled')
    }
  })

  document.body.style.visibility = 'initial'
})
