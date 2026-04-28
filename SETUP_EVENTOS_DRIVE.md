# Configuración: Carga de Imágenes en Eventos a Google Drive

## Cambios Realizados

Se ha actualizado el sistema de eventos para permitir cargar imágenes directamente a Google Drive sin tener que pegar URLs manualmente.

### 1. Nuevo Endpoint: `/api/upload-evento-image`

**Ubicación:** `functions/api/upload-evento-image.ts`

Recibe un archivo de imagen vía `multipart/form-data` y lo sube a Google Drive.

**Parámetros:**
- `file`: Archivo de imagen (requerido)

**Response:**
```json
{
  "url": "https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w2000"
}
```

### 2. Interfaz Actualizada: `EventosManagementSection.tsx`

**Cambios:**
- Nuevo área de carga con drag-and-drop
- Input file para seleccionar imágenes
- Vista previa de URLs cargadas con botón para eliminarlas
- Opción de pegar URLs manualmente como fallback
- Carga automática al servidor sin esperar al usuario

## Configuración Requerida

### En `.env` (o variables de entorno del servidor):

```env
# Folder ID de Google Drive donde se guardarán las imágenes de eventos
GOOGLE_DRIVE_EVENTOS_FOLDER_ID=<YOUR_FOLDER_ID>
```

### Para obtener el Folder ID:

1. Ve a Google Drive
2. Crea una carpeta para eventos (ej: "Codigo316_Eventos")
3. Abre la carpeta y copia el ID de la URL:
   ```
   https://drive.google.com/drive/folders/<FOLDER_ID>
   ```
4. Establece ese ID en `GOOGLE_DRIVE_EVENTOS_FOLDER_ID`

### Permisos de Google Drive API:

- El proyecto necesita tener habilitada la **Google Drive API**
- La service account debe tener acceso a la carpeta configurada
- El scope requerido es: `https://www.googleapis.com/auth/drive.file`

## Cómo Funciona

1. Usuario selecciona imágenes (drag-drop o click)
2. Las imágenes se envían al endpoint `/api/upload-evento-image`
3. El endpoint sube cada imagen a la carpeta configurada en Google Drive
4. Se retorna la URL de miniatura optimizada
5. Las URLs se agregan automáticamente al formulario
6. Al guardar el evento, se almacenan en Firestore

## Notas Técnicas

- Las URLs retornadas usan Google Drive Thumbnail API para optimizar el loading
- Soporta múltiples imágenes simultáneamente
- Valida que los archivos sean imágenes
- Preserva la funcionalidad de pegar URLs manualmente
- Los nombres de archivos incluyen timestamp para evitar duplicados

## Testing

Para probar:

1. Asegúrate de que `GOOGLE_DRIVE_EVENTOS_FOLDER_ID` esté configurado
2. Ve a la sección de "Gestionar Eventos"
3. Haz clic en "+ Nuevo Evento"
4. Arrastra imágenes al área de carga o haz clic para seleccionar
5. Las imágenes deberían cargarse automáticamente
6. Verifica que aparezcan en la lista de URLs
7. Completa el formulario y crea el evento

## Troubleshooting

- **Error 401:** Verifica que el token tenga permisos de Drive
- **Error 500 "GOOGLE_DRIVE_EVENTOS_FOLDER_ID no configurado":** Configura la variable en el servidor
- **Error al subir:** Verifica que la carpeta exista y que la service account tenga acceso
