# API Spesification

> BASE_URL_API_ENDPOINT : `localhost:3000`

## Post

### Get All Posts

Method : `GET`

Endpoint : `/posts`

Auth : `Bearer`

Params :

* page: number
* limit: number
* title: string
* status: string
* published: boolean
* type: string
* category: number|string
* tags[]: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "posts": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Post

Method : `GET`

Endpoint : `/posts/:idorslug`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "post": {
      ...
    }
  }
}
```

### Create Post

Method : `POST`

Endpoint : `/posts`

Auth : `Bearer`

Body :

```typescript
{
  title: string
  content: string
  thumbnail: file
  status: draft|published|unpublished|scheduled|archived|private
  categoryId: number
  publishedAt?: timestamps
  tags?: string[]
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "posts": {
      ...
    }
  }
}
```

### Update Post

Method : `PATCH`

Endpoint : `/posts/:id`

Auth : `Bearer`

Body :

```typescript
{
  title: string
  content: string
  thumbnail: file
  status: draft|published|unpublished|scheduled|archived|private
  categoryId: number
  publishedAt?: timestamps
  tags?: string[]
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "post_id": 1
  }
}
```

### Delete Post

Method : `DELETE`

Endpoint : `/posts/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "post_id": 1
  }
}
```

### Get All Posts (Public)

Method : `GET`

Endpoint : `/posts/public`

Params :

* page: number
* limit: number
* title: string
* status: string
* published: boolean
* type: string
* category: number|string
* tags[]: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "posts": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Post (Public)

Method : `GET`

Endpoint : `/posts/:idorslug/public`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "posts": {
      ...
    }
  }
}
```

## Event

### Get All Events

Method : `GET`

Endpoint : `/events`

Auth : `Bearer`

Params :

* page: number
* limit: number
* title: string
* status: string
* published: boolean
* category: number|string
* tags[]: string
* roles[speaker|host|moderator]: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "events": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Event

Method : `GET`

Endpoint : `/events/:idorslug`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "event": {
      ...
    }
  }
}
```

### Create Event

Method : `POST`

Endpoint : `/events`

Auth : `Bearer`

Body :

```typescript
{
  title: string
  content: string
  thumbnail: file
  status: draft|published|unpublished|scheduled|archived|private
  categoryId: number
  publishedAt?: timestamps
  startDate?: datetime
  endDate?: datetime
  youtubeId?: string
  slidoId?: string
  tags?: string[]
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "posts": {
      ...
    }
  }
}
```

### Update Event

Method : `PATCH`

Endpoint : `/events/:id`

Auth : `Bearer`

Body :

```typescript
{
  title: string
  content: string
  thumbnail: file
  status: draft|published|unpublished|scheduled|archived|private
  categoryId: number
  publishedAt?: timestamps
  startDate?: datetime
  endDate?: datetime
  youtubeId?: string
  slidoId?: string
  tags?: string[]
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "event_id": 1
  }
}
```

### Delete Event

Method : `DELETE`

Endpoint : `/events/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "event_id": 1
  }
}
```

### Get All Events (Public)

Method : `GET`

Endpoint : `/events/public`

Params :

* page: number
* limit: number
* title: string
* status: string
* published: boolean
* type: string
* category: number|string
* tags[]: string
* keyPost: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "events": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Event (Public)

Method : `GET`

Endpoint : `/events/:idorslug/public`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "event": {
      ...
    }
  }
}
```

### Get Event Private By Keypost

Method : `GET`

Endpoint : `/events/private`

Params :

* key: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "event": {
      ...
    }
  }
}
```

### Get Event Coming soon

Method : `GET`

Endpoint : `/events/coming-soon`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "events": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

## Category

### Get All Categories

Method : `GET`

Endpoint : `/categories`

Params :

* page: number
* limit: number
* name: string

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "categories": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Category

Method : `GET`

Endpoint : `/categories/:idorslug`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "category": {
      ...
    }
  }
}
```

### Create Category

Method : `POST`

Endpoint : `/categories`

Auth : `Bearer`

Body :

```typescript
{
  name: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "category": {
      ...
    }
  }
}
```

### Update Category

Method : `PATCH`

Endpoint : `/categories/:id`

Auth : `Bearer`

Body :

```typescript
{
  name: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "category_id": 1
  }
}
```

### Delete Category

Method : `DELETE`

Endpoint : `/categories/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "category_id": 1
  }
}
```

### Delete Categories

Method : `DELETE`

Endpoint : `/categories`

Auth : `Bearer`

Body :
```typescript
{
  ids: number[]
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "category_id": 1
  }
}
```

## User

### Get All Users

Method : `GET`

Endpoint : `/users`

Auth : `Bearer`

Params :

```typescript
{
  name: string
  email: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "users": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One User

Method : `GET`

Endpoint : `/users/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user": {
      ...
    }
  }
}
```

### Get User me

Method : `GET`

Endpoint : `/users/me`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user": {
      ...
    },
    "myPost": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 100,
    "total_page": 10,
    "total_data_per_page": 10
  }
}
```

### Create User

Method : `POST`

Endpoint : `/users`

Auth : `Bearer`

Body :

```typescript
{
  name: string
  email: string
  password: string
  roleId: number
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user": {
      ...
    }
  }
}
```

### Update User

Method : `PATCH`

Endpoint : `/users/:id`

Auth : `Bearer`

Body :

```typescript
{
  name: string
  email: string
  roleId: number
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user_id": 1
  }
}
```

### Update User me

Method : `PATCH`

Endpoint : `/users/me`

Auth : `Bearer`

Body :

```typescript
{
  name: string
  email: string

}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user_id": 1
  }
}
```

### Update User Password

Method : `PATCH`

Auth : `Bearer`

Endpoint : `/users/me/new-password`

Body :

```typescript
{
  currentPassword: string
  newPassword: string
}
```

Response :

```json
{
  "error": false,
  "message": ""
}
```

### Delete User

Method : `DELETE`

Endpoint : `/users/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "user_id": 1
  }
}
```

## Role

### Get All Roles

Method : `GET`

Endpoint : `/roles`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "roles": [...]
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total_data": 10,
    "total_page": 1,
    "total_data_per_page": 10
  }
}
```

### Get One Role

Method : `GET`

Endpoint : `/roles/:id`

Auth : `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "role": {
      ...
    }
  }
}
```

### Create Role

Method : `POST`

Endpoint : `/roles/:id`

Auth : `Bearer`

Body :

```typescript
{
  name: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "role": {
      ...
    }
  }
}
```

### Update Role

Method : `PATCH`

Endpoint : `/roles/:id`

Auth : `Bearer`

Body :

```typescript
{
  name: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "role_id": 1
  }
}
```

### Delete Role

Method : `DELETE`

Endpoint : `/roles/:id`

Auth `Bearer`

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "role_id": 1
  }
}
```

## Auth

### Login

Method : `POST`

Endpoint : `/auth`

Body :

```typescript
{
  email: string
  password: string
}
```

Response :

```json
{
  "error": false,
  "message": "",
  "data": {
    "access_token": ""
  }
}
```

### Logout

Method : `DELETE`

Endpoint : `/auth`

Response :

```json
{
  "error": false,
  "message": ""
}
```
