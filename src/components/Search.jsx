import { useState } from "react";

function Search() {
    const[query, setQuery] = useState("");
    return (
        <div>
            <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            {/* <ul>
                {filteredItems.map(item => (
                    <li key={item}>{item}</li>
                ))}
            </ul> */}
        </div>
    );
}

export default Search;