import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Undo,
  Redo,
  Image as ImageIcon,
  Loader2,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  onImageUpload?: (file: File) => Promise<string>
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Digite o parecer...',
  readOnly = false,
  onImageUpload,
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions that we configure manually or don't want redundant
        heading: {
            levels: [1, 2, 3],
        },
      }),
      // Underline, 
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      // Link.configure({
      //   openOnClick: false,
      //   HTMLAttributes: {
      //     class: 'text-primary underline cursor-pointer',
      //   },
      // }),
      /*
      ATENÇÃO: Removendo Link e Underline pois o log indicou duplicidade.
      Se pararem de funcionar, significa que o StarterKit não os incluía e o log era de outro lugar.
      Mas se o log diz "Duplicate extension names found: ['link', 'underline']", é 99% de certeza que já estão lá.
      */
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
            class: 'max-w-full h-auto rounded-md my-4',
        },
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none focus-visible:ring-0',
      },
    }
  })

  // Sincronizar conteúdo externo com o editor
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // Apenas atualiza se for diferente para evitar loops ou perder cursor
      // Melhor comparação pode ser necessária, mas para reset serve
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const addLink = () => {
    const url = window.prompt('URL do link:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleImageClick = () => {
    if (onImageUpload) {
      // Trigger hidden file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          try {
            setIsUploading(true)
            const url = await onImageUpload(file)
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          } catch (error) {
            console.error('Falha no upload de imagem:', error)
            alert('Falha ao enviar imagem. Tente novamente.')
          } finally {
            setIsUploading(false)
          }
        }
      }
      input.click()
    } else {
      // Fallback para URL
      const url = window.prompt('URL da imagem:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col min-h-[400px]">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10 w-full">
          {/* Formatação de texto */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive('bold')}
            className="data-[active=true]:bg-accent h-8 w-8 p-0"
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive('italic')}
            className="data-[active=true]:bg-accent h-8 w-8 p-0"
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            data-active={editor.isActive('underline')}
            className="data-[active=true]:bg-accent h-8 w-8 p-0"
            title="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1 self-center" />

          {/* Formatação de Títulos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Títulos">
                <Type className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                <Heading1 className="mr-2 h-4 w-4" /> Título 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 className="mr-2 h-4 w-4" /> Título 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 className="mr-2 h-4 w-4" /> Título 3
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
                <Type className="mr-2 h-4 w-4" /> Parágrafo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-border mx-1 self-center" />

          {/* Listas */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive('bulletList')}
            className="data-[active=true]:bg-accent"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive('orderedList')}
            className="data-[active=true]:bg-accent"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Alinhamento */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            data-active={editor.isActive({ textAlign: 'left' })}
            className="data-[active=true]:bg-accent"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            data-active={editor.isActive({ textAlign: 'center' })}
            className="data-[active=true]:bg-accent"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            data-active={editor.isActive({ textAlign: 'right' })}
            className="data-[active=true]:bg-accent"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            data-active={editor.isActive({ textAlign: 'justify' })}
            className="data-[active=true]:bg-accent"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Link */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            data-active={editor.isActive('link')}
            className="data-[active=true]:bg-accent"
            title="Inserir Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          {/* Imagem */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageClick}
            disabled={isUploading}
            className="h-8 w-8 p-0"
            title="Inserir Imagem"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`bg-white ${readOnly ? 'bg-muted/20' : ''}`}
      />
    </div>
  )
}
