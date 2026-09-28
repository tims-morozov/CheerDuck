import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException, UploadFile
from app.core.config import settings

class UploadService:
    """Сохранение загруженных пользователями фото предметов на диск."""

    @staticmethod
    def _detect_image_extension(file: UploadFile) -> Optional[str]:
        """
        Определяет расширение сохраняемого файла: сначала по MIME-типу (он же и белый список),
        а если клиент не передал Content-Type — по расширению исходного имени файла.
        Возвращает None, если формат не разрешен.
        """
        by_mime = settings.ALLOWED_IMAGE_TYPES.get(file.content_type or "")
        if by_mime:
            return by_mime

        suffix = Path(file.filename or "").suffix.lower()
        if suffix in settings.ALLOWED_IMAGE_TYPES.values():
            return suffix

        return None

    @staticmethod
    async def save_images(files: List[UploadFile]) -> List[str]:
        """
        Сохраняет фото в settings.UPLOAD_DIR и возвращает относительные URL
        вида /uploads/<filename> для поля images предмета.
        """
        if len(files) > settings.MAX_IMAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Можно загрузить не более {settings.MAX_IMAGES} фото",
            )

        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        max_size_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        urls: List[str] = []

        for file in files:
            extension = UploadService._detect_image_extension(file)
            if extension is None:
                raise HTTPException(
                    status_code=400,
                    detail="Недопустимый формат файла. Разрешены: JPEG, PNG, WEBP, GIF",
                )

            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Загружен пустой файл")
            if len(content) > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"Файл слишком большой (максимум {max_size_mb} МБ)",
                )

            # Имя генерируем сами (uuid) — защита от path traversal и коллизий
            filename = f"{uuid.uuid4().hex}{extension}"
            (upload_dir / filename).write_bytes(content)
            urls.append(f"/uploads/{filename}")

        return urls
