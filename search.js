const applicationID = '0SQJCGW54X';
const apiKey = '27e4a1695307e93e63743e67aeda4b29';
const indexName = 'restaurants';
const client = algoliasearch(applicationID, apiKey);
const helper = algoliasearchHelper(client, indexName);

$('li.filter-item').hover(function() { $(this).addClass('hover-filter') }, function() { $(this).removeClass('hover-filter') });

$('#restaurant-search').on('keyup', function() {
  helper.setQuery($(this).val()).search();
});

function buildStarsReviewsParagraph(hit) {
  let starsParagraph = '<span>';
  const maxStars = 5;
  const fullStars = Math.round(hit.stars_count);
  const emptyStars = maxStars - fullStars;
  for(let i = 0; i < fullStars; i++) {
    starsParagraph+= '<img src="resources/graphics/stars-plain.png" class="star" />';
  }
  for(let i = 0; i < emptyStars; i++) {
    starsParagraph+= '<img src="resources/graphics/star-empty.png" class="star" />';
  }
  return starsParagraph + '</span>';
}

function renderHits(content) {
  $('#results-list').html(() => {
    return $.map(content.hits, hit => {
      let stars = buildStarsReviewsParagraph(hit);
      return `<div id="show-results">
          <ul id="results-list" class="results-list">
            <li class="result">
              <div>
              <img src="${hit.image_url}" class="result-img">
                <div class="result-text">
                  <p class="result-name">${hit.name}</p>
                  <p class="stars-reviews"><span class="star-rating">${hit.stars_count}</span>
                    ${stars}
                    <span class="reviews-description">(${hit.reviews_count} reviews)</span>
                  </p>
                  <p class="reviews-description no-left-margin">${hit.food_type} | ${hit.neighborhood} | ${hit.price_range}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>`;
    });
  });
}

helper.on('result', content => {
  renderHits(content);
});

helper.search();