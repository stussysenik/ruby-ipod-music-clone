class CreateTracks < ActiveRecord::Migration[8.1]
  def change
    create_table :tracks do |t|
      t.string :title
      t.string :artist_name
      t.references :album, null: false, foreign_key: true
      t.integer :duration_seconds
      t.string :file_path
      t.integer :track_number

      t.timestamps
    end
  end
end
