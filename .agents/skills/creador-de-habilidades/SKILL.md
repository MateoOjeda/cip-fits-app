---
name: creador-de-habilidades
description: Utiliza esta habilidad cuando necesites crear otras habilidades (skills) para el agente. Asegura que las nuevas habilidades se creen siguiendo las convenciones de Antigravity y generen su contenido en español.
---
# Creador de Habilidades

Cuando el usuario te solicite crear una nueva habilidad (skill) para el agente, debes seguir estas instrucciones estrictamente y redactar todo el contenido de la nueva habilidad en idioma español.

## Dónde crear las habilidades
Las habilidades pueden vivir en dos ubicaciones:
- **Específico del workspace**: `<workspace-root>/.agents/skills/<carpeta-de-habilidad>/` (Usa esta por defecto, recomendada para flujos de trabajo específicos del proyecto).
- **Global (todos los workspaces)**: `~/.gemini/antigravity/skills/<carpeta-de-habilidad>/` (Útil para utilidades personales o herramientas de propósito general).

## Estructura de la carpeta de la habilidad
El único archivo requerido es `SKILL.md`. Sin embargo, puedes crear la siguiente estructura si es necesario:
- `SKILL.md` # Instrucciones principales (requerido)
- `scripts/` # Scripts de ayuda (opcional)
- `examples/` # Implementaciones de referencia (opcional)
- `resources/` # Plantillas y otros recursos (opcional)

## Archivo SKILL.md
Para crear una habilidad debes seguir este formato exacto en el archivo `SKILL.md`:

```md
---
name: nombre-de-la-habilidad
description: Una descripción clara de lo que hace la habilidad y cuándo usarla. Esto es lo que el agente lee para decidir si debe aplicar la habilidad. Escribe en tercera persona. (Obligatorio)
---
# Nombre de la Habilidad

Instrucciones detalladas para el agente van aquí.

## Cuándo usar esta habilidad
- Usa esto cuando...
- Esto es útil para...

## Cómo usarla
Guía paso a paso, convenciones y patrones que el agente debe seguir al ejecutar la tarea.
```

## Mejores Prácticas (¡Importante!)
Asegúrate de aplicar estas reglas al crear la nueva habilidad:
1. **Mantén las habilidades enfocadas**: Cada habilidad debe hacer una sola cosa bien. No crees habilidades que "hagan de todo".
2. **Descripciones claras**: La descripción del YAML debe ser muy clara sobre cuándo y para qué se usa. Ejemplo: "Genera pruebas unitarias para código Python usando convenciones de pytest."
3. **Scripts como cajas negras**: Si incluyes scripts en la carpeta `scripts/`, indica en la habilidad que el agente debe ejecutarlos con el argumento `--help` en lugar de leer el código fuente.
4. **Árboles de decisión**: Si la habilidad es compleja, incluye una sección de árbol de decisión que guíe al agente sobre qué enfoque tomar según el contexto.
5. **Idioma Español**: Todo el contenido, descripciones y títulos (`Cuándo usar esta habilidad`, `Cómo usarla`) deben generarse siempre en idioma español.
