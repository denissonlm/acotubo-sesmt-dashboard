const fs = require('fs');

function replacePage3(file, isBatch) {
  let content = fs.readFileSync(file, 'utf-8');
  
  let headerMatch = isBatch 
    ? "Gestão de Records"
    : "ESPAÇAMENTO (D.S.A)";
    
  let headerIdx = content.indexOf(headerMatch);
  if (headerIdx === -1) {
    console.log("Could not find header match in", file);
    return;
  }
  
  let startStr1 = "<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>";
  
  let startIdx = content.indexOf(startStr1, headerIdx);
  
  if (startIdx === -1) {
    console.log("Could not find start tag in", file);
    return;
  }

  let footerStr1 = "<footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>";
  let footerStr2 = "<footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>";
  
  let footerIdx = content.indexOf(footerStr1, startIdx);
  if (footerIdx === -1) footerIdx = content.indexOf(footerStr2, startIdx);
  if (footerIdx === -1) {
    console.log("Could not find footer tag in", file);
    return;
  }

  const newContent = `        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#0F172A', padding: '1.25rem', borderRadius: '12px', color: 'white' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, marginBottom: '0.25rem' }}>STATUS ATUAL</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{calculateSafetyRecords(isBatch ? accidents : filteredAccidents).currentStreak}</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>Dias sem Acidentes</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem' }}>RECORDE HISTÓRICO</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{calculateSafetyRecords(isBatch ? accidents : filteredAccidents).historicalRecord}</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B91C1C', marginTop: '4px' }}>Melhor Marca</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '1.25rem', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem' }}>TOTAL OCORRÊNCIAS</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{isBatch ? accidents.length : filteredAccidents.length}</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', marginTop: '4px' }}>No Período</div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 900, margin: 0, color: '#0F172A' }}>Ranking Abrangente por {safetyGroupBy === 'area' ? 'Área' : 'Divisão'}</h3>
               <span style={{ fontSize: '0.65rem', background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, color: '#475569' }}>Ordem: Dias Sem Acidentes</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '0.5rem', fontSize: '0.65rem', textAlign: 'center', color: '#64748B', fontWeight: 800 }}>Pos.</th>
                    <th style={{ padding: '0.5rem', fontSize: '0.65rem', textAlign: 'left', color: '#64748B', fontWeight: 800 }}>{safetyGroupBy === 'area' ? 'Área' : 'Divisão'}</th>
                    <th style={{ padding: '0.5rem', fontSize: '0.65rem', textAlign: 'center', color: '#64748B', fontWeight: 800 }}>Dias Invicto</th>
                    <th style={{ padding: '0.5rem', fontSize: '0.65rem', textAlign: 'center', color: '#64748B', fontWeight: 800 }}>Última Ocorrência</th>
                    <th style={{ padding: '0.5rem', fontSize: '0.65rem', textAlign: 'center', color: '#64748B', fontWeight: 800 }}>Total de Acidentes</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateSafetyRanking(isBatch ? accidents : filteredAccidents, safetyGroupBy).map((row, idx) => (
                    <tr key={row.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 900, textAlign: 'center', color: idx < 3 ? '#0F172A' : '#64748B' }}>{idx + 1}º</td>
                      <td style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: '#1E293B' }}>{row.name}</td>
                      <td style={{ padding: '0.5rem', fontSize: '0.85rem', fontWeight: 900, textAlign: 'center', color: row.neverHad ? '#10B981' : '#0F172A' }}>
                        {row.neverHad ? \`+\${row.days}\` : row.days}
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.7rem', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>
                        {row.neverHad ? 'Nenhum' : (row.lastDate ? row.lastDate.toLocaleDateString('pt-BR') : '-')}
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', color: '#64748B' }}>
                        {row.totalAccidents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
`;

  let replaced = newContent.replace(/isBatch \? accidents : filteredAccidents/g, isBatch ? 'accidents' : 'filteredAccidents');
  replaced = replaced.replace(/isBatch \? accidents\.length : filteredAccidents\.length/g, isBatch ? 'accidents.length' : 'filteredAccidents.length');
  
  content = content.substring(0, startIdx) + replaced + content.substring(footerIdx);
  fs.writeFileSync(file, content, 'utf-8');
  console.log("Successfully updated", file);
}

replacePage3('src/components/BatchPrintView.tsx', true);
