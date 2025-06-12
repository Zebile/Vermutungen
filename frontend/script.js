async function fetchResults() {
  const res = await fetch('/results');
  const data = await res.json();
  document.getElementById('form').style.display = 'none';
  document.getElementById('results').style.display = 'block';

  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Täter männlich','Täter weiblich','Betroffen Junge','Betroffen Mädchen','nah','fern'],
      datasets: [{
        label: 'Anzahl Stimmen',
        data: [
          data.männlich, data.weiblich,
          data.Junge, data.Mädchen,
          data.nah, data.fern
        ],
        backgroundColor: ['#007bff','#ff007b','#00aa00','#00aabb','#ffaa00','#aa00ff']
      }]
    },
    options: { animation: false }
  });

  setTimeout(fetchResults, 5000);
}

document.getElementById('voteForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (localStorage.getItem('voted')) return alert('Du hast bereits teilgenommen.');
  const form = e.target;
  const payload = {
    gender_perp: form.gender_perp.value,
    gender_victim: form.gender_victim.value,
    relation: form.relation.value
  };
  await fetch('/vote', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  localStorage.setItem('voted', 'true');
  fetchResults();
});
