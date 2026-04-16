# Modelo de Dados

## Entidades principais

### News
- id
- title
- subtitle
- slug
- summary
- content
- status
- category_id
- author_id
- city_id
- state_id
- featured_image_media_id
- is_ai_assisted
- comments_enabled
- seo_title
- seo_description
- published_at
- created_at

### Categories
- id
- name
- slug

### Tags
- id
- name
- slug

### Authors
- id
- name
- avatar_url
- bio

### Media
- id
- type (image, video)
- url
- thumbnail
- alt_text
- caption
- credit
- status

### Comments
- id
- news_id
- user_id
- content
- status

### AI Drafts
- id
- suggested_title
- suggested_content
- suggested_tags
- suggested_category
- confidence_score
- status

## Status

### News
- draft
- draft_ai
- pending_review
- approved
- scheduled
- published
- rejected
- archived

### Media
- pending_review
- approved
- rejected

### Comments
- pending
- approved
- hidden
- spam
