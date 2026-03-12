# Audit Page Revisit

Data: 12 marzo 2026
Area: `Audit / lista audit`
Pagina: [src/app/(dashboard)/audits/page.tsx](/Users/filippo/Desktop/sgic/src/app/(dashboard)/audits/page.tsx)

## Obiettivo

Rendere la pagina `Audit` più utile per l'operatività quotidiana.

La pagina oggi enfatizza tre widget centrali (`Planner snapshot`, `Client trend`, `Location trend`) che occupano molto spazio ma non aiutano davvero a decidere cosa fare oggi e nei prossimi giorni.

La nuova priorità è:

- vedere subito i prossimi 5 giorni lavorativi
- vedere tutti gli audit schedulati in quei giorni
- avere i filtri vicino alla lista che governano
- ridurre la distanza verticale tra filtri e risultati

## Diagnosi attuale

La composizione attuale della pagina è:

1. header + CTA `New Audit`
2. KPI strip
3. toolbar filtri
4. insights panel centrale
5. risultati audit

File principali:

- [src/app/(dashboard)/audits/page.tsx](/Users/filippo/Desktop/sgic/src/app/(dashboard)/audits/page.tsx)
- [src/features/audits/components/audits-toolbar.tsx](/Users/filippo/Desktop/sgic/src/features/audits/components/audits-toolbar.tsx)
- [src/features/audits/components/audits-insights-panel.tsx](/Users/filippo/Desktop/sgic/src/features/audits/components/audits-insights-panel.tsx)
- [src/features/audits/components/audits-results.tsx](/Users/filippo/Desktop/sgic/src/features/audits/components/audits-results.tsx)
- [src/features/audits/lib/audits-list.ts](/Users/filippo/Desktop/sgic/src/features/audits/lib/audits-list.ts)

Problemi attuali:

- il blocco centrale è informativo ma non operativo
- `Client trend` e `Location trend` sono più da analytics che da gestione giornaliera
- il `Planner snapshot` mostra solo un estratto, non una vista completa della settimana
- i filtri sono troppo lontani dalla tabella/lista che controllano
- l'utente scorre parecchio prima di vedere l'effetto dei filtri

## Decisione UX

Rimuovere l'attuale blocco centrale a tre colonne e sostituirlo con una vista settimanale operativa.

Nuovo ordine della pagina:

1. header + CTA
2. KPI strip
3. `Settimana audit`
4. `Explorer audit` con filtri
5. `Risultati audit`

## Nuovo componente: Settimana Audit

### Scopo

Mostrare i prossimi 5 giorni lavorativi e, per ciascun giorno, tutti gli audit schedulati in quella data.

### Regole

- la finestra è composta da 5 giorni lavorativi consecutivi
- i giorni sono `lun-ven`
- se oggi è sabato o domenica, la vista parte dal lunedì successivo
- ogni colonna mostra:
  - giorno della settimana
  - data
  - numero audit schedulati
  - elenco audit del giorno
- ogni card audit deve mostrare almeno:
  - titolo
  - cliente
  - sede
  - stato
  - eventuali segnali rapidi utili (`NC aperte`, `low score`, `overdue` se applicabile)
- se un giorno non ha audit, mostrare comunque la colonna con stato vuoto

### Comportamento desiderato

- clic sulla card audit: apre il dettaglio audit
- se il giorno contiene più audit, l'elenco resta compatto ma leggibile
- il componente deve essere utile sia desktop sia laptop senza creare uno scroll orizzontale ingestibile

### Posizionamento

Sotto la KPI strip e sopra i filtri.

## Filtri e lista

### Problema attuale

`AuditsToolbar` è in alto, mentre `AuditsResults` arriva solo dopo il blocco insights. Questo crea una separazione innaturale tra controllo e risultato.

### Nuovo comportamento

- la settimana sta sopra come blocco autonomo
- subito sotto arrivano `Explorer audit` e `AuditsResults`
- i controlli `Display controls` restano agganciati alla lista risultati

### Effetto desiderato

L'utente deve percepire questa gerarchia:

- prima cosa da fare nei prossimi giorni
- poi come filtrare l'universo audit
- poi la lista/tabella completa

## Impatto sui componenti

### Da rimuovere o sostituire

- [src/features/audits/components/audits-insights-panel.tsx](/Users/filippo/Desktop/sgic/src/features/audits/components/audits-insights-panel.tsx)

Questo componente non serve più nella forma attuale.

### Da introdurre

- `src/features/audits/components/audits-workweek-panel.tsx`

Responsabilità:

- ricevere gli audit filtrati o l'insieme audit deciso dalla pagina
- costruire i 5 giorni lavorativi
- raggruppare gli audit per data
- renderizzare il planner settimanale

### Da adattare

- [src/app/(dashboard)/audits/page.tsx](/Users/filippo/Desktop/sgic/src/app/(dashboard)/audits/page.tsx)
- [src/features/audits/lib/audits-list.ts](/Users/filippo/Desktop/sgic/src/features/audits/lib/audits-list.ts)

## Decisione dati

Il nuovo planner settimanale deve usare gli audit già caricati in pagina, senza una query aggiuntiva nella v1.

Approccio raccomandato:

- partire da `filteredAudits`
- estrarre quelli con `scheduled_date`
- costruire la workweek corrente o imminente
- raggruppare per giorno

Vantaggi:

- zero roundtrip extra
- coerenza con i filtri attivi
- manutenzione più semplice

Nota:

se in futuro vorremo che la settimana resti sempre globale e non filtrata, potremo spostarla su `audits` completi o su query dedicata. Per questa revisione la scelta migliore è mantenere coerenza con i filtri correnti.

## Roadmap implementativa

### Fase 1 - Sostituzione layout

- rimuovere `AuditsInsightsPanel` dalla pagina audit
- inserire `AuditsWorkweekPanel` tra KPI strip e toolbar
- tenere `AuditsToolbar` immediatamente sopra `AuditsResults`

### Fase 2 - Logica settimana lavorativa

- aggiungere helper in [src/features/audits/lib/audits-list.ts](/Users/filippo/Desktop/sgic/src/features/audits/lib/audits-list.ts) oppure in un file dedicato:
  - calcolo prossimo blocco di 5 giorni lavorativi
  - normalizzazione date audit
  - grouping per giorno

### Fase 3 - UI del planner

- layout a 5 colonne desktop
- stack verticale su mobile
- card audit compatte ma cliccabili
- empty state per giorni senza audit

### Fase 4 - Pulizia

- eliminare tipi e funzioni non più usati dagli insights attuali
- verificare che nessuna importazione residuale resti in pagina

## Criteri di accettazione

- la pagina `Audit` non mostra più `Planner snapshot`, `Client trend` e `Location trend`
- sopra i filtri compare una sezione con i prossimi 5 giorni lavorativi
- ogni giorno mostra tutti gli audit schedulati in quella data
- cliccando un audit dal planner si apre il relativo dettaglio
- i filtri risultano immediatamente sopra la lista audit
- la pagina risulta più corta e più coerente nel flusso operativo

## Note di design

- il planner deve sembrare operativo, non analitico
- meglio etichette chiare in italiano: `Questa settimana`, `Nessun audit schedulato`, `oggi`, `domani` se utile
- evitare card troppo alte: questa sezione deve dare scansione rapida, non saturare la pagina

## Next step

Implementare direttamente la revisione in questa sequenza:

1. nuovo componente `AuditsWorkweekPanel`
2. rifattorizzazione di [src/app/(dashboard)/audits/page.tsx](/Users/filippo/Desktop/sgic/src/app/(dashboard)/audits/page.tsx)
3. rimozione definitiva di `AuditsInsightsPanel`
4. test visivo desktop e mobile sulla pagina `/audits`
