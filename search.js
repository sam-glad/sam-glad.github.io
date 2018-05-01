const applicationID = '0SQJCGW54X';
const apiKey = '27e4a1695307e93e63743e67aeda4b29';
const indexName = 'restaurants';
const client = algoliasearch(applicationID, apiKey);

var helper = algoliasearchHelper(client, indexName, {
  facets: ['food_type', 'stars_count']
});

// $('li.facet-item').hover(() => { $(this).addClass('hover-facet') }, () => { $(this).removeClass('hover-facet') });

$('#restaurant-search').on('keyup', function() {
  helper.setQuery($(this).val()).search();
});

$('#food-types').on('click', 'li[id^="ft-"]', e => {
  // FIXME: Oy...
  let facetValue = e.currentTarget.children[0].textContent;
  helper.toggleFacetRefinement('food_type', facetValue).search();
});

function renderFoodTypeList(content) {
  $('#food-types').html(() => {
    return $.map(content.getFacetValues('food_type'), foodType => {
      let li = $(`<li id=ft-${foodType.name} class="facet-item"></li>`);
      li.html(`<span class="facet-option">${foodType.name}</span><span class="results-for-type">${foodType.count}</span>`);
      if(foodType.isRefined) li.addClass('selected-facet');
      return li;
    });
  });
}

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
  renderFoodTypeList(content);

});

helper.search();