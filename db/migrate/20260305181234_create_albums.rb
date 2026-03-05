class CreateAlbums < ActiveRecord::Migration[8.1]
  def change
    create_table :albums do |t|
      t.string :name
      t.string :artist_name
      t.string :cover_image_path
      t.integer :year

      t.timestamps
    end
  end
end
