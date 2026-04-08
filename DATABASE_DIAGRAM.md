# 📊 Diagrama Técnico de Base de Datos (SGC SaaS)

Este diagrama representa la estructura completa de tu base de datos PostgreSQL basada en el archivo `schema.prisma`. 

## 1. Módulo Core y Usuarios
```mermaid
erDiagram
    Tenant ||--o{ User : "tiene"
    Tenant {
        String id PK
        String name
        String slug
        String logo
        String industry
        String timezone
        String currency
        String phone
        PlanType plan
        Boolean active
        DateTime createdAt
        DateTime updatedAt
    }
    User {
        String id PK
        String tenantId FK
        String email
        String password
        String name
        String position
        String phone
        Role role
        String avatar
        Boolean active
        DateTime createdAt
        DateTime updatedAt
    }
```

## 2. Gestión de Procesos (ISO 9001)
```mermaid
erDiagram
    Tenant ||--o{ Process : "gestiona"
    User ||--o{ Process : "responsable"
    Process ||--|| ProcessCharacterization : "se detalla en"
    Process {
        String id PK
        String tenantId FK
        String name
        String code
        ProcessCategory category
        String objective
        String scope
        String responsibleId FK
        String responsibleName
        Int order
        Boolean active
    }
    ProcessCharacterization {
        String id PK
        String processId FK
        String version
        String date
        Json planear
        Json hacer
        Json verificar
        Json actuar
        Json resources
        Json indicators
    }
```

## 3. Gestión Documental y Versiones
```mermaid
erDiagram
    Tenant ||--o{ Document : "almacena"
    Process ||--o{ Document : "vincula"
    Document ||--o{ DocumentVersion : "historial"
    Document {
        String id PK
        String tenantId FK
        String code
        String name
        DocumentType type
        DocumentStatus status
        String processId FK
        Int currentVersion
        String fileUrl
        String fileName
    }
    DocumentVersion {
        String id PK
        String documentId FK
        Int version
        String changeDescription
        String fileUrl
        String fileName
        String uploadedBy
        DateTime uploadedAt
    }
```

## 4. Gestión de Riesgos y Matrices
```mermaid
erDiagram
    Tenant ||--o{ RiskMatrix : "posee"
    RiskMatrix ||--o{ Risk : "agrupa"
    Process ||--o{ Risk : "evalúa"
    RiskMatrix {
        String id PK
        String tenantId FK
        String name
        RiskType type
        String description
    }
    Risk {
        String id PK
        String tenantId FK
        String matrixId FK
        String processId FK
        String description
        RiskType type
        Int probability
        Int impact
        RiskLevel level
        Int riskValue
        ActionStatus status
    }
```

## 5. Auditoría y Mejora Continua
```mermaid
erDiagram
    Tenant ||--o{ Audit : "registra"
    Audit ||--o{ Finding : "genera"
    Finding ||--|| CorrectiveAction : "requiere"
    Audit {
        String id PK
        String tenantId FK
        String name
        String type
        AuditStatus status
        String leadAuditor
        Json processes
        DateTime scheduledDate
    }
    Finding {
        String id PK
        String auditId FK
        FindingType type
        String clause
        String description
        String evidence
    }
    CorrectiveAction {
        String id PK
        String findingId FK
        String description
        String responsible
        DateTime dueDate
        ActionStatus status
        DateTime closedDate
    }
```

## 6. Contexto y Otros
```mermaid
erDiagram
    Tenant ||--o{ DOFAItem : "contiene"
    Tenant ||--o{ Stakeholder : "identifica"
    Tenant ||--o{ SGCScope : "define"
    Tenant ||--o{ FormatControl : "controla"
    
    DOFAItem {
        String id PK
        DOFACategory category
        String description
    }
    Stakeholder {
        String id PK
        String name
        StakeholderType type
        StakeholderInfluence influence
    }
    SGCScope {
        String id PK
        String scopeStatement
        DateTime lastReviewDate
    }
```
