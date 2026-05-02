
const enterreview = async (event) => {
    event.preventDefault();
  
    const brew_id = document.querySelector('#brewid').value;
    const comment = document.querySelector('#pubcomment').value.trim();
  
    if (comment && brew_id) {
      const response = await fetch(`/api/breweries/${brew_id}`, {
        method: 'PUT',
        body: JSON.stringify({ comment }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.ok) {
        document.location.replace('/api/breweries');
      } else {
        alert('Failed to add comment');
      }
    }
  };

  const deletebrewert = async (event) => {
    event.preventDefault();
  
    const brew_id = document.querySelector('#brewid').value;
  
    if (brew_id) {
      const response = await fetch(`/api/breweries/${brew_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.ok) {
        document.location.replace('/api/breweries');
      } else {
        alert('Failed to delete brewery');
      }
    }
  };

document.querySelector('#pubcommentsubmit').addEventListener('click', enterreview);
document.querySelector('#deletebrewery').addEventListener('click', deletebrewert);